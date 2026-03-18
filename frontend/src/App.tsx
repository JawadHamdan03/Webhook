import { useEffect, useState, type FormEvent } from 'react'
import {
  getJobById,
  getJobDeliveries,
  getJobs,
  getPipelines,
  getSubscribersByPipelineId,
  login,
  register,
  createPipeline,
  createSubscriber,
  updatePipeline,
  updateSubscriber,
  deletePipeline,
  deleteSubscriber,
  sendTestWebhook,
  type DeliveryAttempt,
  type Job,
  type Pipeline,
  type Subscriber
} from './lib/api'
import { getErrorMessage } from './lib/errorMessages.ts'
import { clearStoredToken, getStoredToken, setStoredToken } from './lib/storage'
import { DashboardPage } from './Pages/DashboardPage'
import { JobDetailsPage } from './Pages/JobDetailsPage'
import { LoginPage } from './Pages/LoginPage'
import { RegisterPage } from './Pages/RegisterPage'

const defaultCredentials = {
  email: 'admin@example.com',
  password: 'password123'
}

type AuthView = 'login' | 'register'

const App = () => {
  const [email, setEmail] = useState(defaultCredentials.email)
  const [password, setPassword] = useState(defaultCredentials.password)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState(() => getStoredToken())
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [subscribersByPipelineId, setSubscribersByPipelineId] = useState<Record<string, Subscriber[]>>({})
  const [jobs, setJobs] = useState<Job[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authView, setAuthView] = useState<AuthView>('login')
  const [showPipelineModal, setShowPipelineModal] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [pipelineError, setPipelineError] = useState<string | null>(null)
  const [isPipelineSubmitting, setIsPipelineSubmitting] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobDeliveries, setJobDeliveries] = useState<DeliveryAttempt[]>([])
  const [jobDetailsError, setJobDetailsError] = useState<string | null>(null)
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false)
  const [webhookTestError, setWebhookTestError] = useState<string | null>(null)
  const [webhookTestSuccess, setWebhookTestSuccess] = useState<string | null>(null)
  const [isSendingWebhookTest, setIsSendingWebhookTest] = useState(false)
  const [lastCreatedJobId, setLastCreatedJobId] = useState<string | null>(null)
  const [lastCreatedJobStatus, setLastCreatedJobStatus] = useState<Job['status'] | null>(null)
  const [isPollingCreatedJob, setIsPollingCreatedJob] = useState(false)
  const [isSubscriberSubmittingByPipeline, setIsSubscriberSubmittingByPipeline] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!token) {
      setPipelines([])
      setSubscribersByPipelineId({})
      setJobs([])
      return
    }

    let isActive = true

    const loadData = async () => {
      setIsLoadingData(true)
      setError(null)

      try {
        const [pipelineRows, jobRows] = await Promise.all([getPipelines(token), getJobs(token)])
        const subscriberEntries = await Promise.all(
          pipelineRows.map(async (pipeline) => {
            const subscribers = await getSubscribersByPipelineId(pipeline.id, token)
            return [pipeline.id, subscribers] as const
          })
        )

        if (!isActive) {
          return
        }

        setPipelines(pipelineRows)
        setSubscribersByPipelineId(Object.fromEntries(subscriberEntries))
        setJobs(jobRows)
      } catch (loadError) {
        if (!isActive) {
          return
        }

        const errorCode = loadError instanceof Error ? loadError.message : 'request_failed'
        setError(getErrorMessage(errorCode))
        if (errorCode === 'unauthorized') {
          clearStoredToken()
          setToken(null)
        }
      } finally {
        if (isActive) {
          setIsLoadingData(false)
        }
      }
    }

    void loadData()

    return () => {
      isActive = false
    }
  }, [token])

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null)
      setJobDeliveries([])
      setJobDetailsError(null)
      setIsLoadingJobDetails(false)
      return
    }

    let isActive = true
    let pollTimeoutId: number | null = null

    const loadJobDetails = async (showLoadingState: boolean) => {
      if (showLoadingState) {
        setIsLoadingJobDetails(true)
      }

      setJobDetailsError(null)

      try {
        const [jobDetails, deliveries] = await Promise.all([
          getJobById(selectedJobId, token ?? undefined),
          getJobDeliveries(selectedJobId, token ?? undefined)
        ])

        if (!isActive) {
          return
        }

        setSelectedJob(jobDetails)
        setJobDeliveries(deliveries)
        setJobs((previousJobs) => {
          const existingIndex = previousJobs.findIndex((job) => job.id === jobDetails.id)

          if (existingIndex === -1) {
            return [jobDetails, ...previousJobs]
          }

          return previousJobs.map((job) => (job.id === jobDetails.id ? jobDetails : job))
        })

        if (jobDetails.status === 'pending' || jobDetails.status === 'processing') {
          pollTimeoutId = window.setTimeout(() => {
            void loadJobDetails(false)
          }, 2500)
        }
      } catch (detailsError) {
        if (!isActive) {
          return
        }

        const errorCode = detailsError instanceof Error ? detailsError.message : 'request_failed'
        setJobDetailsError(getErrorMessage(errorCode))
      } finally {
        if (isActive && showLoadingState) {
          setIsLoadingJobDetails(false)
        }
      }
    }

    void loadJobDetails(true)

    return () => {
      isActive = false

      if (pollTimeoutId !== null) {
        window.clearTimeout(pollTimeoutId)
      }
    }
  }, [selectedJobId, token])

  useEffect(() => {
    if (!lastCreatedJobId || !token) {
      setIsPollingCreatedJob(false)
      return
    }

    let isActive = true
    let pollTimeoutId: number | null = null

    const pollCreatedJob = async () => {
      setIsPollingCreatedJob(true)

      try {
        const job = await getJobById(lastCreatedJobId, token)

        if (!isActive) {
          return
        }

        setLastCreatedJobStatus(job.status)
        setJobs((previousJobs) => {
          const existingIndex = previousJobs.findIndex((currentJob) => currentJob.id === job.id)

          if (existingIndex === -1) {
            return [job, ...previousJobs]
          }

          return previousJobs.map((currentJob) => (currentJob.id === job.id ? job : currentJob))
        })

        if (job.status === 'pending' || job.status === 'processing') {
          pollTimeoutId = window.setTimeout(() => {
            void pollCreatedJob()
          }, 2500)
          return
        }

        setIsPollingCreatedJob(false)
      } catch {
        if (isActive) {
          setIsPollingCreatedJob(false)
        }
      }
    }

    void pollCreatedJob()

    return () => {
      isActive = false

      if (pollTimeoutId !== null) {
        window.clearTimeout(pollTimeoutId)
      }
    }
  }, [lastCreatedJobId, token])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await login(email, password)
      setStoredToken(response.token)
      setToken(response.token)
    } catch (loginError) {
      const errorCode = loginError instanceof Error ? loginError.message : 'request_failed'
      setError(getErrorMessage(errorCode))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(getErrorMessage('password_mismatch'))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await register(email, password)
      setStoredToken(response.token)
      setToken(response.token)
      setConfirmPassword('')
      setAuthView('login')
    } catch (registerError) {
      const errorCode = registerError instanceof Error ? registerError.message : 'request_failed'
      setError(getErrorMessage(errorCode))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    clearStoredToken()
    setToken(null)
    setError(null)
    setSubscribersByPipelineId({})
    setSelectedJobId(null)
    setSelectedJob(null)
    setJobDeliveries([])
    setJobDetailsError(null)
    setLastCreatedJobId(null)
    setLastCreatedJobStatus(null)
    setIsPollingCreatedJob(false)
  }

  const handleShowRegister = () => {
    setError(null)
    setConfirmPassword('')
    setAuthView('register')
  }

  const handleShowLogin = () => {
    setError(null)
    setConfirmPassword('')
    setAuthView('login')
  }

  const handleCreatePipeline = async (formData: {
    name: string
    actionType: 'add_fields' | 'transform' | 'filter'
    actionConfig: Record<string, unknown>
  }) => {
    if (!token) return

    setPipelineError(null)
    setIsPipelineSubmitting(true)

    try {
      const created = await createPipeline(
        {
          name: formData.name,
          actionType: formData.actionType,
          actionConfig: formData.actionConfig
        },
        token
      )

      setPipelines(prev => [...prev, created])
      setSubscribersByPipelineId((previous) => ({ ...previous, [created.id]: [] }))
      setShowPipelineModal(false)
      setEditingPipeline(null)
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : 'request_failed'
      setPipelineError(getErrorMessage(errorCode))
    } finally {
      setIsPipelineSubmitting(false)
    }
  }

  const handleUpdatePipeline = async (formData: {
    name: string
    actionType: 'add_fields' | 'transform' | 'filter'
    actionConfig: Record<string, unknown>
  }) => {
    if (!token || !editingPipeline) return

    setPipelineError(null)
    setIsPipelineSubmitting(true)

    try {
      const updated = await updatePipeline(
        editingPipeline.id,
        {
          name: formData.name,
          actionType: formData.actionType,
          actionConfig: formData.actionConfig
        },
        token
      )

      setPipelines(prev =>
        prev.map(p => (p.id === editingPipeline.id ? updated : p))
      )
      setShowPipelineModal(false)
      setEditingPipeline(null)
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : 'request_failed'
      setPipelineError(getErrorMessage(errorCode))
    } finally {
      setIsPipelineSubmitting(false)
    }
  }

  const handleDeletePipeline = async (pipelineId: string) => {
    if (!token || !window.confirm('Are you sure you want to delete this pipeline?')) return

    try {
      await deletePipeline(pipelineId, token)
      setPipelines(prev => prev.filter(p => p.id !== pipelineId))
      setSubscribersByPipelineId((previous) => {
        const next = { ...previous }
        delete next[pipelineId]
        return next
      })
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : 'request_failed'
      setError(getErrorMessage(errorCode))
    }
  }

  const handleCreateSubscriber = async (pipelineId: string, targetUrl: string) => {
    if (!token) {
      return
    }

    setIsSubscriberSubmittingByPipeline((previous) => ({ ...previous, [pipelineId]: true }))

    try {
      const created = await createSubscriber(pipelineId, targetUrl, token)
      setSubscribersByPipelineId((previous) => ({
        ...previous,
        [pipelineId]: [...(previous[pipelineId] ?? []), created]
      }))
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : 'request_failed'
      throw new Error(getErrorMessage(errorCode))
    } finally {
      setIsSubscriberSubmittingByPipeline((previous) => ({ ...previous, [pipelineId]: false }))
    }
  }

  const handleUpdateSubscriber = async (pipelineId: string, subscriberId: string, targetUrl: string) => {
    if (!token) {
      return
    }

    setIsSubscriberSubmittingByPipeline((previous) => ({ ...previous, [pipelineId]: true }))

    try {
      const updated = await updateSubscriber(subscriberId, targetUrl, token)
      setSubscribersByPipelineId((previous) => ({
        ...previous,
        [pipelineId]: (previous[pipelineId] ?? []).map((subscriber) =>
          subscriber.id === subscriberId ? updated : subscriber
        )
      }))
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : 'request_failed'
      throw new Error(getErrorMessage(errorCode))
    } finally {
      setIsSubscriberSubmittingByPipeline((previous) => ({ ...previous, [pipelineId]: false }))
    }
  }

  const handleDeleteSubscriber = async (pipelineId: string, subscriberId: string) => {
    if (!token) {
      return
    }

    setIsSubscriberSubmittingByPipeline((previous) => ({ ...previous, [pipelineId]: true }))

    try {
      await deleteSubscriber(subscriberId, token)
      setSubscribersByPipelineId((previous) => ({
        ...previous,
        [pipelineId]: (previous[pipelineId] ?? []).filter((subscriber) => subscriber.id !== subscriberId)
      }))
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : 'request_failed'
      throw new Error(getErrorMessage(errorCode))
    } finally {
      setIsSubscriberSubmittingByPipeline((previous) => ({ ...previous, [pipelineId]: false }))
    }
  }

  const handleOpenCreateModal = () => {
    setEditingPipeline(null)
    setPipelineError(null)
    setShowPipelineModal(true)
  }

  const handleOpenEditModal = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline)
    setPipelineError(null)
    setShowPipelineModal(true)
  }

  const handleCloseModal = () => {
    setShowPipelineModal(false)
    setEditingPipeline(null)
    setPipelineError(null)
  }

  const handleOpenJobDetails = (jobId: string) => {
    setSelectedJobId(jobId)
  }

  const handleCloseJobDetails = () => {
    setSelectedJobId(null)
    setSelectedJob(null)
    setJobDeliveries([])
    setJobDetailsError(null)
  }

  const handleSendWebhookTest = async (sourceKey: string, payload: Record<string, unknown>) => {
    if (!token) {
      return
    }

    setWebhookTestError(null)
    setWebhookTestSuccess(null)
    setLastCreatedJobId(null)
    setLastCreatedJobStatus(null)
    setIsSendingWebhookTest(true)

    try {
      const response = await sendTestWebhook(sourceKey, payload)
      const refreshedJobs = await getJobs(token)

      setJobs(refreshedJobs)
      setWebhookTestSuccess(`Webhook accepted. Job ${response.jobId} was created.`)
      setLastCreatedJobId(response.jobId)
      setLastCreatedJobStatus(refreshedJobs.find((job) => job.id === response.jobId)?.status ?? 'pending')
    } catch (sendError) {
      const errorCode = sendError instanceof Error ? sendError.message : 'request_failed'
      setWebhookTestError(getErrorMessage(errorCode))
    } finally {
      setIsSendingWebhookTest(false)
    }
  }

  const jobsByStatus = jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.status] = (acc[job.status] ?? 0) + 1
    return acc
  }, {})

  const currentJob = selectedJob ?? (selectedJobId ? jobs.find(job => job.id === selectedJobId) ?? null : null)
  const currentPipeline = currentJob ? pipelines.find(pipeline => pipeline.id === currentJob.pipelineId) ?? null : null
  const currentSubscribers = currentPipeline ? subscribersByPipelineId[currentPipeline.id] ?? [] : []
  const isCurrentJobLive = Boolean(currentJob && (currentJob.status === 'pending' || currentJob.status === 'processing'))

  if (!token) {
    if (authView === 'register') {
      return (
        <RegisterPage
          confirmPassword={confirmPassword}
          email={email}
          error={error}
          isSubmitting={isSubmitting}
          onConfirmPasswordChange={setConfirmPassword}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onShowLogin={handleShowLogin}
          onSubmit={handleRegister}
          password={password}
        />
      )
    }

    return (
      <LoginPage
        email={email}
        error={error}
        isSubmitting={isSubmitting}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onShowRegister={handleShowRegister}
        onSubmit={handleLogin}
        password={password}
      />
    )
  }

  if (selectedJobId) {
    return (
      <JobDetailsPage
        deliveries={jobDeliveries}
        error={jobDetailsError}
        isLoading={isLoadingJobDetails}
        isLiveUpdating={isCurrentJobLive}
        job={currentJob}
        onBack={handleCloseJobDetails}
        pipeline={currentPipeline}
        subscribers={currentSubscribers}
      />
    )
  }

  return (
    <DashboardPage
      error={error}
      isLoadingData={isLoadingData}
      jobs={jobs}
      jobsByStatus={jobsByStatus}
      onLogout={handleLogout}
      onOpenJobDetails={handleOpenJobDetails}
      pipelines={pipelines}
      pipelineSubscribers={subscribersByPipelineId}
      isSubscriberSubmittingByPipeline={isSubscriberSubmittingByPipeline}
      onCreateSubscriber={handleCreateSubscriber}
      onDeleteSubscriber={handleDeleteSubscriber}
      onSendWebhookTest={handleSendWebhookTest}
      onUpdateSubscriber={handleUpdateSubscriber}
      onViewCreatedJob={handleOpenJobDetails}
      onCreatePipeline={handleCreatePipeline}
      onUpdatePipeline={handleUpdatePipeline}
      onDeletePipeline={handleDeletePipeline}
      onOpenCreateModal={handleOpenCreateModal}
      onOpenEditModal={handleOpenEditModal}
      onCloseModal={handleCloseModal}
      createdJobId={lastCreatedJobId}
      createdJobStatus={lastCreatedJobStatus}
      isPollingCreatedJob={isPollingCreatedJob}
      webhookTestError={webhookTestError}
      webhookTestSuccess={webhookTestSuccess}
      isSendingWebhookTest={isSendingWebhookTest}
      showPipelineModal={showPipelineModal}
      editingPipeline={editingPipeline}
      pipelineError={pipelineError}
      isPipelineSubmitting={isPipelineSubmitting}
    />
  )
}

export default App
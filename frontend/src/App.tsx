import { useEffect, useState, type FormEvent } from 'react'
import { getJobs, getPipelines, login, register, type Job, type Pipeline } from './lib/api'
import { getErrorMessage } from './lib/errorMessages.ts'
import { clearStoredToken, getStoredToken, setStoredToken } from './lib/storage'
import { DashboardPage } from './Pages/DashboardPage'
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
  const [jobs, setJobs] = useState<Job[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authView, setAuthView] = useState<AuthView>('login')

  useEffect(() => {
    if (!token) {
      setPipelines([])
      setJobs([])
      return
    }

    let isActive = true

    const loadData = async () => {
      setIsLoadingData(true)
      setError(null)

      try {
        const [pipelineRows, jobRows] = await Promise.all([getPipelines(token), getJobs()])
        if (!isActive) {
          return
        }

        setPipelines(pipelineRows)
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

  const jobsByStatus = jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.status] = (acc[job.status] ?? 0) + 1
    return acc
  }, {})

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

  return (
    <DashboardPage
      error={error}
      isLoadingData={isLoadingData}
      jobs={jobs}
      jobsByStatus={jobsByStatus}
      onLogout={handleLogout}
      pipelines={pipelines}
    />
  )
}

export default App
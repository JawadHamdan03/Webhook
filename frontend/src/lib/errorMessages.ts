const errorMessages: Record<string, string> = {
    email_in_use: 'That email is already registered. Try signing in instead.',
    invalid_request: 'Please check the form and make sure all fields are valid.',
    invalid_credentials: 'The email or password is incorrect.',
    unauthorized: 'Your session expired. Please sign in again.',
    request_failed: 'The request could not be completed. Please try again.',
    password_mismatch: 'Password and confirm password must match.',
    server_error: 'The server could not complete the request. Please try again shortly.',
    server_misconfigured: 'The server is not configured correctly right now.',
    not_found: 'The requested resource could not be found.'
}

export const getErrorMessage = (errorCode: string) => {
    return errorMessages[errorCode] ?? 'Something went wrong. Please try again.'
}
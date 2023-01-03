import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import jwtDecode from 'jwt-decode'
import apiAddress from '../../utils/apiAddress'
import { logOut, setCredentials } from '../features/auth/authSlice'

const baseQuery = fetchBaseQuery({
  baseUrl: apiAddress.baseURL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token

    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args, api, extraOptions) => {
  //   console.log(args) // request url, method, body
  //   console.log(api) // signal, dispatch, getState()
  //   console.log(extraOptions) //custom like {shout: true}

  let result
  const token = api.getState().auth.token

  if (token) {
    const userToken = jwtDecode(token)
    const tokenExpirationMs = userToken.exp * 1000 // jwt token expiration date is represented in seconds => expiration * 1000
    const requestTime = new Date().getTime() // store the time when a new request is made
    const isTokenExpired = tokenExpirationMs - requestTime < 1

    if (isTokenExpired) {
      console.log('expired token')
      const refreshResult = await baseQuery('/auth/refresh', api, extraOptions)

      if (refreshResult?.error) {
        console.log('expired session')

        api.dispatch(logOut())
      }
      if (refreshResult?.data) {
        console.log('new token')
        const { accessToken } = refreshResult?.data
        api.dispatch(setCredentials(accessToken))
      }
    }
    result = await baseQuery(args, api, extraOptions)
  } else {
    console.log('not logged in')
    result = await baseQuery(args, api, extraOptions)
  }

  return result
}

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({}),
})

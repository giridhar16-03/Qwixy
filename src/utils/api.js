import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://mock.qwixy.local',
  timeout: 1000,
})

export async function getMockSuggestion() {
  await new Promise((resolve) => setTimeout(resolve, 250))
  return {
    text: 'You are strongest in morning sessions. Schedule your toughest topic first and keep one 25-minute review block before bedtime.',
  }
}

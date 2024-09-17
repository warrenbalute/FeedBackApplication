// app/LoginForm.tsx
'use client'

import { useState } from 'react'
import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    const success = await login(formData)
    if (success) {
      window.location.reload()
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </CardContent>
    </Card>
  )
}
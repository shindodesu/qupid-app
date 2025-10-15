'use client'

import { LoginForm, GuestGuard } from '@/components/auth'
import { Container, Stack } from '@/components/ui'

export default function LoginPage() {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Container className="max-w-md">
          <Stack size={8} className="text-center">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Qupid
              </h1>
              <p className="text-neutral-600">
                素敵な出会いを見つけましょう
              </p>
            </div>
            
            <LoginForm />
          </Stack>
        </Container>
      </div>
    </GuestGuard>
  )
}

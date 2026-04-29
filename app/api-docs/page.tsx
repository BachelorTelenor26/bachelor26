'use client'
import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch('/api/swagger')
      .then(res => res.json())
      .then(setSpec)
  }, [])

  if (!spec) return <div className="p-8 text-gray-500">Laster...</div>

  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI spec={spec} />
    </div>
  )
}
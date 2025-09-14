'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Users, FileText, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/Authcontext'
import { toast } from 'sonner'

export default function JoinPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    grade: '',
    class: '',
    phone: '',
    experience: '',
    motivation: '',
    skills: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 验证必填字段
    if (!formData.name || !formData.email || !formData.grade || !formData.motivation) {
      setError('请填写所有必填字段')
      setLoading(false)
      return
    }

    try {
      // 这里可以添加提交申请的API调用
      // const response = await fetch('/api/join', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      
      // 模拟提交成功
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('申请已提交！我们会尽快联系您')
      router.push('/?message=申请已提交成功')
    } catch (error: any) {
      console.error('提交申请失败:', error)
      setError(error.message || '提交失败，请稍后重试')
      toast.error('提交失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              加入新闻社
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              欢迎加入我们的新闻社团队！请填写以下信息，我们会尽快与您联系。
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    姓名 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="请输入您的姓名"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    邮箱 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="请输入您的邮箱"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                    年级 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="grade"
                    name="grade"
                    type="text"
                    value={formData.grade}
                    onChange={handleInputChange}
                    placeholder="如：高一、高二、高三"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class" className="text-sm font-medium text-gray-700">
                    班级
                  </Label>
                  <Input
                    id="class"
                    name="class"
                    type="text"
                    value={formData.class}
                    onChange={handleInputChange}
                    placeholder="如：1班、2班"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  联系电话
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="请输入您的联系电话"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience" className="text-sm font-medium text-gray-700">
                  相关经验
                </Label>
                <Textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="请描述您在写作、摄影、编辑等方面的经验（可选）"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation" className="text-sm font-medium text-gray-700">
                  加入动机 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="motivation"
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  placeholder="请告诉我们您为什么想加入新闻社，以及您希望在这里获得什么"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills" className="text-sm font-medium text-gray-700">
                  特长技能
                </Label>
                <Textarea
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="请描述您的特长技能，如写作、摄影、设计、编程等（可选）"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    提交申请
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>提交申请后，我们会在3个工作日内与您联系</p>
              <p className="mt-1">
                如有疑问，请联系：
                <a href="mailto:202660103@stu.scls-sh.org" className="text-blue-600 hover:text-blue-800 ml-1">
                  202660103@stu.scls-sh.org
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
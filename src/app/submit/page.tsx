'use client'

import { useState } from 'react'
import { Send, Upload, FileText, MessageSquare, Users, Image, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
// 移除认证相关导入
import { toast } from 'sonner'

// 投稿类型配置
const submissionTypes = {
  news: {
    name: '新闻投稿',
    icon: FileText,
    description: '分享校园新闻、活动报道、学术成果等',
    categories: ['学校新闻', '学术成果', '活动报道', '社团动态', '校园设施', '政策通知'],
    requirements: [
      '内容真实准确，有新闻价值',
      '提供相关图片或视频素材',
      '注明消息来源和联系方式',
      '遵守新闻伦理和校园规定'
    ]
  },
  topic: {
    name: '话题发起',
    icon: MessageSquare,
    description: '发起校园话题讨论，分享观点和经验',
    categories: ['学习交流', '校园生活', '社团活动', '升学指导', '兴趣爱好', '其他讨论'],
    requirements: [
      '话题具有讨论价值和意义',
      '内容积极正面，符合校园文化',
      '鼓励理性讨论和交流',
      '避免争议性和敏感话题'
    ]
  },
  sharespeare: {
    name: 'Sharespeare 分享',
    icon: Users,
    description: '分享学习经验、技能心得、成长故事',
    categories: ['学习方法', '技能分享', '竞赛经验', '社会实践', '兴趣爱好', '成长感悟'],
    requirements: [
      '内容原创，具有分享价值',
      '提供详细的经验和方法',
      '可以回答读者的相关问题',
      '鼓励互动和深度交流'
    ]
  }
}

// 模拟投稿历史
const mockSubmissions = [
  {
    id: '1',
    type: 'news',
    title: '学校举办科技创新大赛',
    status: 'approved',
    submitTime: '2024-01-20T10:00:00Z',
    reviewTime: '2024-01-21T14:30:00Z',
    reviewer: '编辑部',
    feedback: '内容丰富，图片清晰，已发布到新闻中心'
  },
  {
    id: '2',
    type: 'topic',
    title: '关于期末复习方法的讨论',
    status: 'pending',
    submitTime: '2024-01-22T09:15:00Z',
    reviewer: null,
    feedback: null
  },
  {
    id: '3',
    type: 'sharespeare',
    title: '我的英语学习心得分享',
    status: 'rejected',
    submitTime: '2024-01-19T16:20:00Z',
    reviewTime: '2024-01-20T11:45:00Z',
    reviewer: '内容审核员',
    feedback: '内容过于简单，建议补充更多具体的学习方法和实例'
  }
]

interface SubmissionForm {
  type: string
  title: string
  category: string
  content: string
  tags: string
  images: File[]
  contactInfo: string
  agreement: boolean
}

function SubmissionCard({ submission }: { submission: any }) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return { 
          name: '已通过', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          icon: CheckCircle
        }
      case 'pending':
        return { 
          name: '审核中', 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          icon: Clock
        }
      case 'rejected':
        return { 
          name: '未通过', 
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          icon: AlertCircle
        }
      default:
        return { 
          name: '未知', 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
          icon: AlertCircle
        }
    }
  }

  const statusInfo = getStatusInfo(submission.status)
  const StatusIcon = statusInfo.icon
  const typeInfo = submissionTypes[submission.type as keyof typeof submissionTypes]
  const TypeIcon = typeInfo.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-5 h-5 text-muted-foreground" />
            <Badge variant="outline">{typeInfo.name}</Badge>
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.name}
          </Badge>
        </div>
        <CardTitle className="text-lg">{submission.title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <div>投稿时间：{new Date(submission.submitTime).toLocaleString('zh-CN')}</div>
            {submission.reviewTime && (
              <div>审核时间：{new Date(submission.reviewTime).toLocaleString('zh-CN')}</div>
            )}
            {submission.reviewer && (
              <div>审核人员：{submission.reviewer}</div>
            )}
          </div>
          
          {submission.feedback && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>审核反馈：</strong>{submission.feedback}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SubmitPage() {
  // 移除认证相关逻辑
  const [activeTab, setActiveTab] = useState('submit')
  const [selectedType, setSelectedType] = useState('news')
  const [form, setForm] = useState<SubmissionForm>({
    type: 'news',
    title: '',
    category: '',
    content: '',
    tags: '',
    images: [],
    contactInfo: '',
    agreement: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
  // Temporary user placeholder until authentication is implemented
  const user = null;

    e.preventDefault()
    
    if (!user) {
      toast.error('请先登录')
      return
    }

    if (!form.agreement) {
      toast.error('请同意投稿须知')
      return
    }

    setIsSubmitting(true)
    
    try {
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('投稿提交成功！我们会在24小时内完成审核')
      
      // 重置表单
      setForm({
        type: selectedType,
        title: '',
        category: '',
        content: '',
        tags: '',
        images: [],
        contactInfo: '',
        agreement: false
      })
      
      // 切换到历史记录
      setActiveTab('history')
    } catch (error) {
      toast.error('提交失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + form.images.length > 5) {
      toast.error('最多只能上传5张图片')
      return
    }
    
    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }))
  }

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const currentTypeInfo = submissionTypes[selectedType as keyof typeof submissionTypes]
  const TypeIcon = currentTypeInfo.icon

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center p-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">需要登录</h2>
          <p className="text-muted-foreground mb-4">
            请先登录后再进行投稿
          </p>
          <Button>前往登录</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <Send className="w-8 h-8 text-blue-500" />
          投稿中心
        </h1>
        <p className="text-lg text-muted-foreground">
          分享你的声音，让更多人听见
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submit">我要投稿</TabsTrigger>
          <TabsTrigger value="guidelines">投稿须知</TabsTrigger>
          <TabsTrigger value="history">投稿历史</TabsTrigger>
        </TabsList>
        
        <TabsContent value="submit" className="mt-6">
          <div className="max-w-4xl mx-auto">
            {/* 投稿类型选择 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>选择投稿类型</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(submissionTypes).map(([key, type]) => {
                    const Icon = type.icon
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedType === key ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                        }`}
                        onClick={() => {
                          setSelectedType(key)
                          setForm(prev => ({ ...prev, type: key, category: '' }))
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className={`w-8 h-8 mx-auto mb-2 ${
                            selectedType === key ? 'text-blue-500' : 'text-muted-foreground'
                          }`} />
                          <h3 className="font-medium mb-1">{type.name}</h3>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 投稿表单 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TypeIcon className="w-5 h-5" />
                  {currentTypeInfo.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 标题 */}
                  <div className="space-y-2">
                    <Label htmlFor="title">标题 *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="请输入标题（建议10-50字）"
                      required
                    />
                  </div>

                  {/* 分类 */}
                  <div className="space-y-2">
                    <Label htmlFor="category">分类 *</Label>
                    <Select value={form.category} onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentTypeInfo.categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 内容 */}
                  <div className="space-y-2">
                    <Label htmlFor="content">内容 *</Label>
                    <Textarea
                      id="content"
                      value={form.content}
                      onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="请详细描述你的内容（建议200字以上）"
                      className="min-h-[200px]"
                      required
                    />
                  </div>

                  {/* 标签 */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">标签</Label>
                    <Input
                      id="tags"
                      value={form.tags}
                      onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="请输入标签，用逗号分隔（如：学习方法,经验分享）"
                    />
                  </div>

                  {/* 图片上传 */}
                  <div className="space-y-2">
                    <Label>图片素材</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        点击上传图片或拖拽到此处（最多5张，每张不超过5MB）
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        选择图片
                      </Button>
                    </div>
                    
                    {form.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {form.images.map((file, index) => (
                          <div key={index} className="relative">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              <Image className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                              onClick={() => removeImage(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 联系方式 */}
                  <div className="space-y-2">
                    <Label htmlFor="contact">联系方式</Label>
                    <Input
                      id="contact"
                      value={form.contactInfo}
                      onChange={(e) => setForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                      placeholder="请留下联系方式，方便编辑与您沟通"
                    />
                  </div>

                  {/* 投稿须知同意 */}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="agreement"
                      checked={form.agreement}
                      onChange={(e) => setForm(prev => ({ ...prev, agreement: e.target.checked }))}
                      className="mt-1"
                    />
                    <Label htmlFor="agreement" className="text-sm">
                      我已阅读并同意 <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab('guidelines')}>投稿须知</Button>
                    </Label>
                  </div>

                  {/* 提交按钮 */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || !form.agreement}
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        提交投稿
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="guidelines" className="mt-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>投稿须知</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    请仔细阅读以下投稿要求，确保您的投稿符合我们的标准。
                  </AlertDescription>
                </Alert>

                {Object.entries(submissionTypes).map(([key, type]) => {
                  const Icon = type.icon
                  return (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Icon className="w-5 h-5" />
                          {type.name}
                        </CardTitle>
                        <p className="text-muted-foreground">{type.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">投稿要求：</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {type.requirements.map((req, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">可选分类：</h4>
                            <div className="flex flex-wrap gap-2">
                              {type.categories.map(category => (
                                <Badge key={category} variant="outline">{category}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                <Card>
                  <CardHeader>
                    <CardTitle>审核流程</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium">提交投稿</h4>
                          <p className="text-sm text-muted-foreground">填写完整信息并提交</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium">内容审核</h4>
                          <p className="text-sm text-muted-foreground">编辑团队在24小时内完成审核</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium">发布上线</h4>
                          <p className="text-sm text-muted-foreground">审核通过后正式发布</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">我的投稿历史</h2>
              <Badge variant="outline">{mockSubmissions.length} 篇投稿</Badge>
            </div>
            
            {mockSubmissions.length > 0 ? (
              <div className="space-y-4">
                {mockSubmissions.map(submission => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">暂无投稿记录</p>
                  <p>快去创作你的第一篇投稿吧！</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

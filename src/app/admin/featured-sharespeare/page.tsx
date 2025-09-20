'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Star, 
  Search, 
  Eye, 
  Edit,
  ArrowLeft,
  Loader2,
  Check
} from 'lucide-react'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/Authcontext'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Sharespeare {
  id: string
  title: string
  content_rich: string
  status: 'DRAFT' | 'PUBLISHED'
  published_at: string | null
  created_at: string
  profiles: {
    id: string
    display_name: string
  }
}

function FeaturedSharespeareManagementContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sharespeare, setSharespeare] = useState<Sharespeare[]>([])
  const [filteredSharespeare, setFilteredSharespeare] = useState<Sharespeare[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFeaturedId, setCurrentFeaturedId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [itemToSelect, setItemToSelect] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterSharespeare()
  }, [sharespeare, searchTerm])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 使用认证上下文的客户端实例
      const authClient = createClient()
      
      // 加载当前精选的文章ID
      const { data: configData, error: configError } = await authClient
        .from('homepage_config')
        .select('config_value')
        .eq('config_key', 'featured_sharespeare_id')
        .single()

      if (configError && configError.code !== 'PGRST116') {
        throw configError
      }

      setCurrentFeaturedId(configData?.config_value || null)

      // 加载所有已发布的Sharespeare文章
      const { data, error } = await authClient
        .from('sharespeare')
        .select(`
          id,
          title,
          content_rich,
          media_url,
          published_at,
          status,
          created_at,
          profiles!sharespeare_author_id_fkey(id, display_name)
        `)
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSharespeare(data || [])
    } catch (error) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const filterSharespeare = () => {
    let filtered = sharespeare

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content_rich.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.profiles.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredSharespeare(filtered)
  }

  const handleSelectFeatured = async (id: string) => {
    setItemToSelect(id)
    setConfirmDialogOpen(true)
  }

  const confirmSelectFeatured = async () => {
    if (!itemToSelect) return

    try {
      setUpdating(true)
      
      // 检查用户是否已登录
      if (!user) {
        toast.error('请先登录')
        router.push('/login')
        return
      }
      
      // 使用认证上下文的客户端实例
      const authClient = createClient()
      
      // 获取当前会话
      const { data: sessionData, error: sessionError } = await authClient.auth.getSession()
      
      if (sessionError) {
        console.error('获取会话失败:', sessionError)
        toast.error('获取登录状态失败，请重新登录')
        router.push('/login')
        return
      }
      
      let accessToken = sessionData?.session?.access_token
      
      // 如果没有访问令牌，尝试获取用户信息来验证登录状态
      if (!accessToken) {
        const { data: userData, error: userError } = await authClient.auth.getUser()
        
        if (userError || !userData?.user) {
          console.error('用户未登录或会话已过期:', userError)
          toast.error('登录状态已失效，请重新登录')
          router.push('/login')
          return
        }
        
        // 如果用户存在但没有访问令牌，尝试刷新会话
        const { data: refreshData, error: refreshError } = await authClient.auth.refreshSession()
        
        if (refreshError || !refreshData?.session?.access_token) {
          console.error('刷新会话失败:', refreshError)
          toast.error('登录状态已失效，请重新登录')
          router.push('/login')
          return
        }
        
        accessToken = refreshData.session.access_token
      }

      // 调用 API 设置精选文章
      const response = await fetch('/api/homepage-config/featured-sharespeare', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          sharespeare_id: itemToSelect
        })
      })

      if (!response.ok) {
        const error = await response.json()
        
        // 如果是认证错误，提示重新登录
        if (response.status === 401) {
          toast.error('登录状态已失效，请重新登录')
          router.push('/login')
          return
        }
        
        throw new Error(error.error || '设置失败')
      }

      setCurrentFeaturedId(itemToSelect)
      toast.success('已设置为首页精选文章')
    } catch (error) {
      console.error('设置精选文章失败:', error)
      toast.error(error instanceof Error ? error.message : '设置精选文章失败')
    } finally {
      setUpdating(false)
      setConfirmDialogOpen(false)
      setItemToSelect(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    const textContent = content.replace(/<[^>]*>/g, '')
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...' 
      : textContent
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const currentFeaturedArticle = sharespeare.find(item => item.id === currentFeaturedId)

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/admin')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回管理首页
        </Button>
        <div>
          <h1 className="text-2xl font-bold">设置首页精选Sharespeare</h1>
          <p className="text-muted-foreground">选择一篇文章作为首页的精选推荐</p>
        </div>
      </div>

      {/* 当前精选文章 */}
      <Card>
        <CardHeader>
          <CardTitle>当前精选文章</CardTitle>
          <CardDescription>
            当前在首页显示的精选Sharespeare文章
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentFeaturedArticle ? (
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-yellow-50">
              <Star className="h-5 w-5 text-yellow-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{currentFeaturedArticle.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  作者：{currentFeaturedArticle.profiles.display_name} | 
                  发布时间：{formatDate(currentFeaturedArticle.published_at || currentFeaturedArticle.created_at)}
                </p>
                <p className="text-sm">{truncateContent(currentFeaturedArticle.content_rich, 150)}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>尚未设置精选文章</p>
              <p className="text-sm">请从下方列表中选择一篇文章</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>选择精选文章</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索标题、内容或作者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 文章列表 */}
          {filteredSharespeare.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? '没有找到匹配的文章' : '暂无已发布的Sharespeare文章'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>内容预览</TableHead>
                  <TableHead>发布时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSharespeare.map((item) => (
                  <TableRow key={item.id} className={item.id === currentFeaturedId ? 'bg-yellow-50' : ''}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate" title={item.title}>
                        {item.title}
                      </div>
                    </TableCell>
                    <TableCell>{item.profiles.display_name}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="text-sm text-muted-foreground">
                        {truncateContent(item.content_rich)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(item.published_at || item.created_at)}
                    </TableCell>
                    <TableCell>
                      {item.id === currentFeaturedId ? (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                          <Star className="h-3 w-3 mr-1" />
                          当前精选
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          普通文章
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.id === currentFeaturedId ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            已选中
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectFeatured(item.id)}
                            disabled={updating}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            设为精选
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/sharespeare/${item.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认设置精选文章</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将这篇文章设为首页精选吗？这将替换当前的精选文章。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSelectFeatured} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  设置中...
                </>
              ) : (
                '确认设置'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function FeaturedSharespearePage() {
  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-8">
        <FeaturedSharespeareManagementContent />
      </div>
    </AdminGuard>
  )
}
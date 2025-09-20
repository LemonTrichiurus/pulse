'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  ArrowLeft,
  Calendar,
  User,
  Image,
  FileText
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/Authcontext'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { toast } from 'sonner'
import Link from 'next/link'

interface Sharespeare {
  id: string
  title: string
  content_rich: string
  media_url?: string
  media_urls?: string[]
  published_at?: string
  status: 'DRAFT' | 'PUBLISHED'
  profiles: {
    id: string
    display_name: string
  }
  created_at: string
}

function SharespeareManagementContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sharespeare, setSharespeare] = useState<Sharespeare[]>([])
  const [filteredSharespeare, setFilteredSharespeare] = useState<Sharespeare[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadSharespeare()
  }, [])

  useEffect(() => {
    filterSharespeare()
  }, [sharespeare, searchTerm, statusFilter])

  const loadSharespeare = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('sharespeare')
        .select(`
          *,
          profiles!sharespeare_author_id_fkey (
            id,
            display_name
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('加载Sharespeare失败:', error)
        toast.error('加载Sharespeare失败')
        return
      }
      
      setSharespeare(data || [])
    } catch (error) {
      console.error('加载Sharespeare失败:', error)
      toast.error('加载Sharespeare失败')
    } finally {
      setLoading(false)
    }
  }

  const filterSharespeare = () => {
    let filtered = sharespeare

    // 状态筛选
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content_rich.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredSharespeare(filtered)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    setDeleting(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('sharespeare')
        .delete()
        .eq('id', itemToDelete)
      
      if (error) {
        console.error('删除失败:', error)
        toast.error('删除失败')
        return
      }
      
      toast.success('Sharespeare删除成功')
      await loadSharespeare()
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (itemId: string) => {
    setItemToDelete(itemId)
    setDeleteDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">草稿</Badge>
      case 'PUBLISHED':
        return <Badge variant="outline" className="text-green-600 border-green-600">已发布</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const hasMedia = (item: Sharespeare) => {
    return (item.media_url && item.media_url.trim() !== '') || 
           (item.media_urls && item.media_urls.length > 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const draftCount = sharespeare.filter(s => s.status === 'DRAFT').length
  const publishedCount = sharespeare.filter(s => s.status === 'PUBLISHED').length
  const mediaCount = sharespeare.filter(s => hasMedia(s)).length
  const textCount = sharespeare.filter(s => !hasMedia(s)).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回管理后台
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sharespeare 管理</h1>
            <p className="text-muted-foreground">
              管理创意分享和多媒体内容
            </p>
          </div>
        </div>
        <Link href="/admin/sharespeare/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            创建内容
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
            <Edit className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{draftCount}</div>
            <p className="text-xs text-muted-foreground">待发布</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发布</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{publishedCount}</div>
            <p className="text-xs text-muted-foreground">公开可见</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">多媒体</CardTitle>
            <Image className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{mediaCount}</div>
            <p className="text-xs text-muted-foreground">含媒体文件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">纯文本</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{textCount}</div>
            <p className="text-xs text-muted-foreground">仅文字内容</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选和搜索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索标题或内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="PUBLISHED">已发布</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 内容列表 */}
      <div className="space-y-4">
        {filteredSharespeare.length > 0 ? (
          filteredSharespeare.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      {hasMedia(item) && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <Image className="h-3 w-3 mr-1" />
                          多媒体
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {item.profiles.display_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {item.published_at ? formatDate(item.published_at) : formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  {/* 媒体预览 */}
                  {hasMedia(item) && (
                    <div className="ml-4">
                      <img 
                        src={item.media_url} 
                        alt="媒体预览" 
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 ml-4">
                    <Link href={`/admin/sharespeare/${item.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openDeleteDialog(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {item.content_rich.replace(/<[^>]*>/g, '').substring(0, 200)}...
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">暂无内容</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'ALL' 
                  ? '没有符合条件的内容' 
                  : '还没有创建任何Sharespeare内容'}
              </p>
              <Link href="/admin/sharespeare/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个内容
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个Sharespeare内容吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false)
                setItemToDelete(null)
              }}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SharespeareManagementPage() {
  return (
    <AdminGuard>
      <SharespeareManagementContent />
    </AdminGuard>
  )
}
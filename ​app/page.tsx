'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

// تعريف نوع المنتج (اختياري)
type Product = {
  id: string
  name: string
  description: string | null
  category: string | null
  supplier_cost: number
  agent_price: number
  retail_price: number
  is_active: boolean
  stock: number | null
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null) // معرف المنتج الجاري شراؤه
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        showNotification('error', 'فشل تحميل المنتجات')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000) // إخفاء بعد 5 ثوانٍ
  }

  const handleBuy = async (product: Product) => {
    if (!user) {
      showNotification('info', 'يجب تسجيل الدخول أولاً')
      router.push('/login') // ستحتاج لصفحة تسجيل دخول أو توجيه مناسب
      return
    }

    // تأكيد الشراء (يمكن استبداله بمودال)
    const confirmed = window.confirm(`هل تريد شراء ${product.name}؟`)
    if (!confirmed) return

    setPurchasing(product.id)
    try {
      const { data, error } = await supabase.functions.invoke('purchase-product', {
        body: { product_id: product.id, quantity: 1 },
      })

      if (error) throw error

      if (data?.success) {
        showNotification('success', `تم شراء ${product.name} بنجاح!`)
        // يمكن تحديث رصيد المستخدم هنا إذا لزم (سيتم عبر الاشتراك أو إعادة الجلب)
      } else {
        showNotification('error', data?.message || 'فشل عملية الشراء')
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      showNotification('error', error.message || 'حدث خطأ غير متوقع')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* إشعارات */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* رأس الصفحة */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">المتجر الرقمي</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <span>مرحباً، {user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              تسجيل خروج
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            تسجيل دخول
          </button>
        )}
      </div>

      {/* شبكة المنتجات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-blue-600">
                  ${product.retail_price.toFixed(2)}
                </span>
                <button
                  onClick={() => handleBuy(product)}
                  disabled={purchasing === product.id}
                  className={`px-4 py-2 rounded text-white ${
                    purchasing === product.id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {purchasing === product.id ? 'جارٍ الشراء...' : 'شراء'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-500 mt-12">لا توجد منتجات متاحة حالياً.</p>
      )}
    </div>
  )
          }

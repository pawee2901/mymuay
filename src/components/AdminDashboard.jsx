'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Layers, 
  Database, 
  Users, 
  History,
  TrendingUp,
  DollarSign,
  Package,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Bell,
  Menu,
  X,
  Mail,
  Settings,
  KeyRound,
  List,
  Gamepad2,
  GripVertical,
  Check
} from 'lucide-react';
import EmailSettingsPanel from '@/components/EmailSettingsPanel';
import Swal from 'sweetalert2';

export default function AdminDashboard({ categories, subcategories = [], products, orders, users, adminUser, ctaCards, depositSetting, carouselSlides, siteSetting }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('stats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingField, setUploadingField] = useState(null); // 'cat' | 'prod' | 'subcat' | 'depositQr' | 'card1' | 'card2' | 'card3' | 'card4'

  // PIN Verification State
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');

  // Check pin verification status on mount
  useEffect(() => {
    const verified = sessionStorage.getItem('admin_pin_verified') === 'true';
    if (verified) {
      setIsPinVerified(true);
    }
  }, []);

  // Idle timeout detector (1 hour)
  useEffect(() => {
    if (!isPinVerified) return;

    let timeoutId;
    const IDLE_TIME = 3600000; // 1 hour in ms

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleIdleTimeout, IDLE_TIME);
    };

    const handleIdleTimeout = async () => {
      console.log('[IDLE TIMEOUT] Admin inactive for 1 hour, logging out...');
      sessionStorage.removeItem('admin_pin_verified');
      setIsPinVerified(false);
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/auth/signin';
      } catch (err) {
        console.error('Logout failed:', err);
        router.push('/auth/signin');
      }
    };

    // User activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleEvent = () => resetTimer();
    events.forEach(event => {
      window.addEventListener(event, handleEvent);
    });

    // Start timer on mount/verification
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [isPinVerified]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!isPinVerified) return;

    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms
    const intervalId = setInterval(() => {
      console.log('[AUTO-REFRESH] Refreshing admin dashboard data...');
      router.refresh();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isPinVerified, router]);

  const handleVerifyPin = (enteredPin) => {
    if (enteredPin === '2901') {
      sessionStorage.setItem('admin_pin_verified', 'true');
      setIsPinVerified(true);
      setPinError(false);
      setPinInput('');
      setPinErrorMessage('');
    } else {
      setPinError(true);
      setPinInput('');
      setPinErrorMessage('รหัสผ่าน PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      // Reset error state after 1.5 seconds (for shake effect)
      setTimeout(() => setPinError(false), 1500);
    }
  };

  // Subcategory Add Form State
  const [newSubcatName, setNewSubcatName] = useState('');
  const [newSubcatImage, setNewSubcatImage] = useState('');
  const [newSubcatParentId, setNewSubcatParentId] = useState(categories[0]?.id || '');

  // Product Option Add Form State
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');
  const [newOptionAgentPrice, setNewOptionAgentPrice] = useState('');
  const [newOptionExternalPackCode, setNewOptionExternalPackCode] = useState('');
  const [newOptionPosition, setNewOptionPosition] = useState(0);
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [selectedOptionIdForStock, setSelectedOptionIdForStock] = useState('');

  // Deposit edit state
  const [depBankName, setDepBankName] = useState(depositSetting?.bankName || '');
  const [depAccountNumber, setDepAccountNumber] = useState(depositSetting?.accountNumber || '');
  const [depAccountName, setDepAccountName] = useState(depositSetting?.accountName || '');
  const [depQrImageUrl, setDepQrImageUrl] = useState(depositSetting?.qrImageUrl || '');
  const [depBankLogoUrl, setDepBankLogoUrl] = useState(depositSetting?.bankLogoUrl || '');
  const [depLineNotifyToken, setDepLineNotifyToken] = useState(depositSetting?.lineNotifyToken || '');
  const [depLineChannelAccessToken, setDepLineChannelAccessToken] = useState(depositSetting?.lineChannelAccessToken || '');
  const [depLineAdminUserId, setDepLineAdminUserId] = useState(depositSetting?.lineAdminUserId || '');
  const [depSlipOkApiKey, setDepSlipOkApiKey] = useState(depositSetting?.slipOkApiKey || '');
  const [depSlipOkBranchId, setDepSlipOkBranchId] = useState(depositSetting?.slipOkBranchId || '');

  // Site Settings state
  const [siteStoreName, setSiteStoreName] = useState(siteSetting?.storeName || 'mymuayy');
  const [siteLogoUrl, setSiteLogoUrl] = useState(siteSetting?.logoUrl || '');

  // Product list search & filter state
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');

  useEffect(() => {
    if (depositSetting) {
      setDepBankName(depositSetting.bankName);
      setDepAccountNumber(depositSetting.accountNumber);
      setDepAccountName(depositSetting.accountName);
      setDepQrImageUrl(depositSetting.qrImageUrl);
      setDepBankLogoUrl(depositSetting.bankLogoUrl || '');
      setDepLineNotifyToken(depositSetting.lineNotifyToken || '');
      setDepLineChannelAccessToken(depositSetting.lineChannelAccessToken || '');
      setDepLineAdminUserId(depositSetting.lineAdminUserId || '');
      setDepSlipOkApiKey(depositSetting.slipOkApiKey || '');
      setDepSlipOkBranchId(depositSetting.slipOkBranchId || '');
    }
  }, [depositSetting]);

  useEffect(() => {
    if (siteSetting) {
      setSiteStoreName(siteSetting.storeName);
      setSiteLogoUrl(siteSetting.logoUrl);
    }
  }, [siteSetting]);

  // CTA Cards edit state
  const [editedCards, setEditedCards] = useState(
    ctaCards && ctaCards.length === 4 
      ? ctaCards 
      : [
          { id: 'card1', title: '', description: '', imageUrl: '', linkUrl: '' },
          { id: 'card2', title: '', description: '', imageUrl: '', linkUrl: '' },
          { id: 'card3', title: '', description: '', imageUrl: '', linkUrl: '' },
          { id: 'card4', title: '', description: '', imageUrl: '', linkUrl: '' },
        ]
  );

  useEffect(() => {
    if (ctaCards && ctaCards.length === 4) {
      setEditedCards(ctaCards);
    }
  }, [ctaCards]);

  const handleCardInputChange = (cardId, field, value) => {
    setEditedCards(prev => 
      prev.map(c => c.id === cardId ? { ...c, [field]: value } : c)
    );
  };

  const handleUpdateCard = async (cardId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const cardToUpdate = editedCards.find(c => c.id === cardId);

    try {
      const res = await fetch('/api/admin/ctacards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardToUpdate),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg(`อัปเดตข้อมูลกล่องแนะนำ "${cardToUpdate.title}" เรียบร้อยแล้ว!`);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการอัปเดตกล่องแนะนำ');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  // Carousel edit state
  const [editedCarouselSlides, setEditedCarouselSlides] = useState(carouselSlides || []);

  useEffect(() => {
    if (carouselSlides) {
      setEditedCarouselSlides(carouselSlides);
    }
  }, [carouselSlides]);

  const handleCarouselInputChange = (slideId, field, value) => {
    setEditedCarouselSlides(prev => 
      prev.map(s => s.id === slideId ? { ...s, [field]: value } : s)
    );
  };

  const handleUpdateCarouselSlide = async (slideId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const slideToUpdate = editedCarouselSlides.find(s => s.id === slideId);

    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...slideToUpdate,
          slideType: 'FULL_MEDIA'
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg('อัปเดตข้อมูลภาพสไลด์แบนเนอร์โปรโมตเรียบร้อยแล้ว!');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการอัปเดตสไลด์โปรโมต');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleAddCarouselSlide = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setEditedCarouselSlides(prev => [...prev, data.slide]);
        setSuccessMsg('เพิ่มสไลด์แบนเนอร์โปรโมตใหม่สำเร็จ!');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'ล้มเหลวในการเพิ่มสไลด์โปรโมต');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCarouselSlide = async (slideId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณแน่ใจหรือไม่ที่จะลบสไลด์แบนเนอร์นี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/carousel?id=${slideId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setEditedCarouselSlides(prev => prev.filter(s => s.id !== slideId));
        setSuccessMsg('ลบสไลด์แบนเนอร์สำเร็จ!');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'ล้มเหลวในการลบสไลด์โปรโมต');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDepositSettings = async (e, mode = 'deposit') => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/deposit-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: depBankName,
          accountNumber: depAccountNumber,
          accountName: depAccountName,
          qrImageUrl: depQrImageUrl,
          bankLogoUrl: depBankLogoUrl,
          lineNotifyToken: depLineNotifyToken,
          lineChannelAccessToken: depLineChannelAccessToken,
          lineAdminUserId: depLineAdminUserId,
          slipOkApiKey: depSlipOkApiKey,
          slipOkBranchId: depSlipOkBranchId
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        if (mode === 'line') {
          setSuccessMsg('อัปเดตและล็อคข้อมูลการตั้งค่าแจ้งเตือน LINE Bot เรียบร้อยแล้ว!');
        } else {
          setSuccessMsg('อัปเดตข้อมูลบัญชีการเติมเงินเรียบร้อยแล้ว!');
        }
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleUpdateSiteSettings = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: siteStoreName,
          logoUrl: siteLogoUrl
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg('อัปเดตข้อมูลการตั้งค่าร้านค้า (โลโก้ & ชื่อร้าน) เรียบร้อยแล้ว!');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าร้านค้า');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  // --- FORM STATES ---
  // Create Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);

  // Create Product Form
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdAgentPrice, setNewProdAgentPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdType, setNewProdType] = useState('ACCOUNT');
  const [newProdGameServiceCode, setNewProdGameServiceCode] = useState('');
  const [newProdExternalPackCode, setNewProdExternalPackCode] = useState('');
  const [newProdCatId, setNewProdCatId] = useState(categories[0]?.id || '');
  const [newProdSubCatId, setNewProdSubCatId] = useState('');

  // Edit Product Form state
  const [editingProdId, setEditingProdId] = useState(null);
  const [inlineOptionsData, setInlineOptionsData] = useState({});
  const [draggedIdx, setDraggedIdx] = useState(null);

  const isGameManager = activeTab === 'games';
  const managedProductType = isGameManager ? 'TOPUP' : 'ACCOUNT';
  const managedProducts = products.filter((prod) => prod.type === managedProductType);
  const productTypesByCategoryId = products.reduce((acc, prod) => {
    if (!acc[prod.categoryId]) acc[prod.categoryId] = new Set();
    acc[prod.categoryId].add(prod.type);
    return acc;
  }, {});
  const visibleCategoryFilters = categories.filter((cat) => {
    const isGame = cat.id.endsWith('_cat');
    return isGameManager ? isGame : !isGame;
  });
  const visibleProductCategories = visibleCategoryFilters;

  useEffect(() => {
    if (activeTab !== 'products' && activeTab !== 'games') return;
    if (editingProdId) return;

    setNewProdType(managedProductType);
  }, [activeTab, editingProdId, managedProductType]);

  useEffect(() => {
    if (activeTab !== 'products' && activeTab !== 'games') return;
    if (!productCategoryFilter) return;
    if (visibleCategoryFilters.some((cat) => cat.id === productCategoryFilter)) return;

    setProductCategoryFilter('');
  }, [activeTab, productCategoryFilter, visibleCategoryFilters]);

  useEffect(() => {
    if (activeTab !== 'products' && activeTab !== 'games') return;
    if (editingProdId) return;
    if (visibleProductCategories.some((cat) => cat.id === newProdCatId)) return;

    setNewProdCatId(visibleProductCategories[0]?.id || categories[0]?.id || '');
    setNewProdSubCatId('');
  }, [activeTab, categories, editingProdId, newProdCatId, visibleProductCategories]);

  const handleStartEditProduct = (prod) => {
    setEditingProdId(prod.id);
    setNewProdName(prod.name);
    setNewProdDesc(prod.description);
    setNewProdPrice(prod.price.toString());
    setNewProdAgentPrice((prod.agentPrice || 0).toString());
    setNewProdImage(prod.image);
    setNewProdType(prod.type);
    setNewProdGameServiceCode(prod.gameServiceCode || '');
    setNewProdExternalPackCode(prod.externalPackCode || '');
    
    // Find category ID matching the categoryName or categoryId
    const cat = categories.find(c => c.name === prod.categoryName);
    if (cat) {
      setNewProdCatId(cat.id);
    } else {
      setNewProdCatId(prod.categoryId || categories[0]?.id || '');
    }
    setNewProdSubCatId(prod.subCategoryId || '');
  };

  const handleCancelEditProduct = () => {
    setEditingProdId(null);
    setNewProdName('');
    setNewProdDesc('');
    setNewProdPrice('');
    setNewProdAgentPrice('');
    setNewProdImage('');
    setNewProdType('ACCOUNT');
    setNewProdGameServiceCode('');
    setNewProdExternalPackCode('');
    setNewProdCatId(categories[0]?.id || '');
    setNewProdSubCatId('');
  };

  // Add Stock Form
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [stockLines, setStockLines] = useState('');
  const [isMultiLineStock, setIsMultiLineStock] = useState(false);
  const [splitMode, setSplitMode] = useState('line'); // 'line', 'blank', 'delimiter', 'none'
  const [guideImageUrl, setGuideImageUrl] = useState('');
  const [uploadingGuideImage, setUploadingGuideImage] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);

  const handleGuideImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาเลือกเฉพาะไฟล์รูปภาพ (png, jpg, jpeg) เท่านั้น',
        icon: 'warning',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    setUploadingGuideImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }

      setGuideImageUrl(data.url);
      Swal.fire({
        title: 'อัปโหลดสำเร็จ',
        text: 'อัปโหลดภาพวิธีการเข้าเรียบร้อยแล้ว',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        title: 'อัปโหลดล้มเหลว',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setUploadingGuideImage(false);
    }
  };

  // Auto-select first option when product selection changes in stock replenishment
  useEffect(() => {
    const prod = products.find(p => p.id === selectedProdId);
    if (prod?.options && prod.options.length > 0) {
      setSelectedOptionIdForStock(prod.options[0].id);
    } else {
      setSelectedOptionIdForStock('');
    }
  }, [selectedProdId, products]);

  // Stock management states and handlers
  const [stockItems, setStockItems] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  const fetchStockItems = async (prodId, optId) => {
    if (!prodId) {
      setStockItems([]);
      return;
    }
    setIsLoadingStock(true);
    try {
      let url = `/api/admin/stock?productId=${prodId}`;
      if (optId) {
        url += `&productOptionId=${optId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setStockItems(data.stockItems || []);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock') {
      fetchStockItems(selectedProdId, selectedOptionIdForStock);
    } else {
      setStockItems([]);
    }
  }, [selectedProdId, selectedOptionIdForStock, activeTab]);

  const handleDeleteStockItem = async (itemId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบสต๊อกนี้',
      text: 'คุณต้องการลบสต๊อกสินค้าชิ้นนี้ออกถาวรจริงหรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/stock?id=${itemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg('ลบรายการสต๊อกเรียบร้อยแล้ว!');
        fetchStockItems(selectedProdId, selectedOptionIdForStock);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการลบรายการสต๊อก');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleClearAllStock = async (prodId, optId) => {
    const selectedProd = products.find(p => p.id === prodId);
    const selectedOpt = selectedProd?.options?.find(o => o.id === optId);
    
    const targetName = selectedOpt 
      ? `"${selectedProd.name} (${selectedOpt.name})"`
      : `"${selectedProd.name}"`;

    const result = await Swal.fire({
      title: 'ยืนยันการล้างสต๊อกทั้งหมด',
      text: `คุณต้องการลบสต๊อกที่ยังไม่ได้ขายทั้งหมดของสินค้า ${targetName} จริงหรือไม่? การลบนี้ไม่สามารถกู้คืนได้!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ล้างทั้งหมด!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      let url = `/api/admin/stock?productId=${prodId}`;
      if (optId) {
        url += `&productOptionId=${optId}`;
      }
      
      const res = await fetch(url, {
        method: 'DELETE',
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg(data.message || 'ล้างสต๊อกเรียบร้อยแล้ว!');
        fetchStockItems(selectedProdId, selectedOptionIdForStock);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการล้างสต๊อก');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  // OTP Email Form has been removed

  const handleUploadImage = async (e, field, cardId = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น (เช่น png, jpg, jpeg, webp, gif)',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    setUploadingField(field);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }

      if (field === 'cat') {
        setNewCatImage(data.url);
      } else if (field === 'subcat') {
        setNewSubcatImage(data.url);
      } else if (field === 'prod') {
        setNewProdImage(data.url);
      } else if (field === 'depositQr') {
        setDepQrImageUrl(data.url);
      } else if (field === 'depositBankLogo') {
        setDepBankLogoUrl(data.url);
      } else if (field === 'siteLogo') {
        setSiteLogoUrl(data.url);
      } else if (field.startsWith('card')) {
        handleCardInputChange(cardId, 'imageUrl', data.url);
      } else if (field.startsWith('slide')) {
        handleCarouselInputChange(cardId, 'image', data.url);
      }

      setSuccessMsg('อัปโหลดรูปภาพสำเร็จแล้ว!');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      Swal.fire({
        title: 'อัปโหลดล้มเหลว',
        text: 'เกิดข้อผิดพลาดในการอัปโหลด: ' + err.message,
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  // --- CALCULATE STATS ---
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalItemsSold = completedOrders.reduce((sum, o) => sum + o.quantity, 0);

  // Group revenues by Day (Last 7 days mock representation based on actual database dates)
  const dailyStats = {};
  completedOrders.forEach(order => {
    const dateStr = new Date(order.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    dailyStats[dateStr] = (dailyStats[dateStr] || 0) + order.totalPrice;
  });

  const dailyStatsArray = Object.keys(dailyStats).map(date => ({
    date,
    revenue: dailyStats[date]
  })).slice(0, 7).reverse();

  // Group revenues by Month
  const monthlyStats = {};
  completedOrders.forEach(order => {
    const monthStr = new Date(order.createdAt).toLocaleDateString('th-TH', { month: 'long', year: '2-digit' });
    monthlyStats[monthStr] = (monthlyStats[monthStr] || 0) + order.totalPrice;
  });

  const monthlyStatsArray = Object.keys(monthlyStats).map(month => ({
    month,
    revenue: monthlyStats[month]
  }));

  // --- ACTIONS ---
  // 1. Create Category Action
  // 1. Save Category Action (Create / Update)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const url = '/api/admin/categories';
      const method = editingCatId ? 'PUT' : 'POST';
      let customId = undefined;
      if (!editingCatId && isGameManager) {
        const rand = Math.random().toString(36).substring(2, 10);
        customId = `game_${rand}_cat`;
      }

      const bodyData = editingCatId 
        ? { id: editingCatId, name: newCatName, image: newCatImage } 
        : { id: customId, name: newCatName, image: newCatImage };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg(editingCatId ? `แก้ไขหมวดหมู่เรียบร้อยแล้ว!` : `เพิ่มหมวดหมู่ "${newCatName}" เรียบร้อยแล้ว!`);
        setNewCatName('');
        setNewCatImage('');
        setEditingCatId(null);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleStartEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setNewCatName(cat.name);
    setNewCatImage(cat.image || '');
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setNewCatName('');
    setNewCatImage('');
  };

  const handleDeleteCategory = async (catId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบหมวดหมู่หลัก',
      text: 'คุณต้องการลบหมวดหมู่หลักนี้หรือไม่? ลบแล้วสินค้าและหมวดหมู่ย่อยทั้งหมดในหมวดหมู่นี้จะถูกลบไปด้วยแบบถาวร!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/categories?id=${catId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg('ลบหมวดหมู่หลักสำเร็จ!');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการลบหมวดหมู่หลัก');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  // 1.5 Create/Delete Subcategory Actions
  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubcatName,
          image: newSubcatImage || null,
          categoryId: newSubcatParentId
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg(`สร้างหมวดหมู่ย่อย "${newSubcatName}" สำเร็จ!`);
        setNewSubcatName('');
        setNewSubcatImage('');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่ย่อย');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleDeleteSubcategory = async (subcatId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบหมวดหมู่ย่อย',
      text: 'คุณต้องการลบหมวดหมู่ย่อยนี้หรือไม่? สินค้าในหมวดหมู่ย่อยนี้จะถูกยกเลิกการผูกหมวดหมู่ย่อย',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/subcategories?id=${subcatId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg('ลบหมวดหมู่ย่อยสำเร็จ!');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการลบหมวดหมู่ย่อย');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleCreateOption = async (e) => {
    e.preventDefault();
    if (!editingProdId) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const isEdit = !!editingOptionId;
      const url = '/api/admin/options';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        name: newOptionName,
        price: newOptionPrice,
        agentPrice: newOptionAgentPrice || '0',
        externalPackCode: newOptionExternalPackCode,
        position: newOptionPosition
      };
      if (isEdit) {
        body.id = editingOptionId;
      } else {
        body.productId = editingProdId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg(isEdit ? 'แก้ไขตัวเลือกสินค้าสำเร็จ!' : `เพิ่มตัวเลือกสินค้า "${newOptionName}" สำเร็จ!`);
        setNewOptionName('');
        setNewOptionPrice('');
        setNewOptionAgentPrice('');
        setNewOptionExternalPackCode('');
        setNewOptionPosition(0);
        setEditingOptionId(null);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการบันทึกตัวเลือกสินค้า');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleStartEditOption = (opt) => {
    setEditingOptionId(opt.id);
    setNewOptionName(opt.name);
    setNewOptionPrice(opt.price.toString());
    setNewOptionAgentPrice((opt.agentPrice || 0).toString());
    setNewOptionExternalPackCode(opt.externalPackCode || '');
    setNewOptionPosition(opt.position || 0);
  };

  const handleCancelEditOption = () => {
    setEditingOptionId(null);
    setNewOptionName('');
    setNewOptionPrice('');
    setNewOptionAgentPrice('');
    setNewOptionExternalPackCode('');
    setNewOptionPosition(0);
  };

  const handleInlineChange = (optId, field, value) => {
    setInlineOptionsData(prev => {
      const currentProd = products.find(p => p.id === editingProdId);
      const opt = currentProd?.options?.find(o => o.id === optId) || {};
      const current = prev[optId] || {
        name: opt.name,
        price: opt.price,
        agentPrice: opt.agentPrice || 0,
        externalPackCode: opt.externalPackCode || '',
        position: opt.position || 0
      };
      return {
        ...prev,
        [optId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const isOptionChanged = (opt) => {
    const edited = inlineOptionsData[opt.id];
    if (!edited) return false;
    return (
      edited.name !== opt.name ||
      Number(edited.price) !== Number(opt.price) ||
      Number(edited.agentPrice) !== Number(opt.agentPrice || 0) ||
      edited.externalPackCode !== (opt.externalPackCode || '') ||
      Number(edited.position) !== Number(opt.position || 0)
    );
  };

  const handleSaveInlineOption = async (optId) => {
    const edited = inlineOptionsData[optId];
    if (!edited) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: optId,
          name: edited.name,
          price: parseFloat(edited.price),
          agentPrice: parseFloat(edited.agentPrice) || 0,
          externalPackCode: edited.externalPackCode,
          position: parseInt(edited.position) || 0
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg(`บันทึกตัวเลือกสินค้า "${edited.name}" สำเร็จ!`);
        setInlineOptionsData(prev => {
          const next = { ...prev };
          delete next[optId];
          return next;
        });
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการบันทึกตัวเลือกสินค้า');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIdx(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetIdx, sortedOptions) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      return;
    }

    const newOptions = [...sortedOptions];
    const [draggedItem] = newOptions.splice(draggedIdx, 1);
    newOptions.splice(targetIdx, 0, draggedItem);

    setDraggedIdx(null);
    setIsLoading(true);

    try {
      for (let i = 0; i < newOptions.length; i++) {
        const opt = newOptions[i];
        const newPos = i;
        if (opt.position !== newPos) {
          await fetch('/api/admin/options', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: opt.id,
              position: newPos
            })
          });
        }
      }
      setSuccessMsg('สลับลำดับตัวเลือกสินค้าสำเร็จ!');
      router.refresh();
    } catch (error) {
      console.error('Failed to reorder options:', error);
      setErrorMsg('เกิดข้อผิดพลาดในการสลับลำดับตัวเลือกสินค้า');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOptionPosition = async (optionId, newPosition) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: optionId,
          position: newPosition
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg('อัปเดตลำดับการแสดงผลเรียบร้อยแล้ว!');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการอัปเดตลำดับตัวเลือกสินค้า');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleDeleteOption = async (optionId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบตัวเลือกสินค้า',
      text: 'คุณต้องการลบตัวเลือกสินค้านี้หรือไม่? สต๊อกสินค้าที่ผูกกับตัวเลือกนี้จะถูกย้ายเป็นไม่ผูกตัวเลือก หรือลบความสัมพันธ์',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/options?id=${optionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg('ลบตัวเลือกสินค้าสำเร็จ!');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการลบตัวเลือกสินค้า');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  // 2. Create/Save Product Action (Handles POST and PUT)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const isEdit = !!editingProdId;
      const url = '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        name: newProdName,
        description: newProdDesc,
        price: newProdPrice,
        agentPrice: newProdAgentPrice || '0',
        image: newProdImage,
        type: newProdType,
        gameServiceCode: newProdGameServiceCode,
        externalPackCode: newProdExternalPackCode,
        categoryId: newProdCatId,
        subCategoryId: newProdSubCatId || null
      };
      if (isEdit) {
        body.id = editingProdId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg(isEdit ? `แก้ไขสินค้าเรียบร้อยแล้ว!` : `เพิ่มสินค้า "${newProdName}" เรียบร้อยแล้ว!`);
        handleCancelEditProduct();
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  // Delete Product Action
  const handleDeleteProduct = async (prodId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบสินค้า',
      text: 'คุณต้องการลบสินค้านี้ออกจากระบบจริงหรือไม่? การลบจะทำลายข้อมูลคีย์สต๊อกสินค้าที่เกี่ยวข้องทั้งหมด',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/products?id=${prodId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg('ลบสินค้าเรียบร้อยแล้ว!');
        if (editingProdId === prodId) {
          handleCancelEditProduct();
        }
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการลบสินค้า');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  // 3. Add Stock Action
  const handleAddStock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProdId,
          productOptionId: selectedOptionIdForStock || null,
          stockLines,
          isMultiLine: splitMode !== 'line',
          splitMode,
          guideImage: guideImageUrl || null
        }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMsg(`เติมคีย์สต๊อกสำเร็จ! เพิ่มเข้าระบบจำนวน ${data.addedCount} ชิ้น`);
        setStockLines('');
        setGuideImageUrl('');
        fetchStockItems(selectedProdId, selectedOptionIdForStock);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการเติมคีย์สต๊อก');
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  const handleToggleUserRole = async (userId, newRole) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (userId === adminUser.userId) {
      Swal.fire({
        title: 'ดำเนินการไม่ได้',
        text: 'คุณไม่สามารถเปลี่ยนบทบาทของตัวเองได้!',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'ยืนยันการปรับยศ',
      text: `คุณต้องการปรับยศผู้ใช้นี้เป็น "${newRole}" ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, เปลี่ยนเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`ปรับยศสำเร็จแล้ว!`);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการปรับยศสมาชิก');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เครือข่ายขัดข้อง');
    }
  };

  if (!isPinVerified) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4 select-none relative overflow-hidden font-sans">
        {/* Soft blue glowing backgrounds */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

        <div className={`relative max-w-sm w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center shadow-2xl transition-all duration-300 ${pinError ? 'animate-shake border-red-500/40 bg-red-500/5' : ''}`}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30 mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          
          <h2 className="text-lg font-black text-white leading-tight">ระบบความปลอดภัยร้านค้า</h2>
          <p className="text-xs text-slate-300 mt-2 font-medium">กรุณากรอกรหัสผ่าน 4 หลัก เพื่อตรวจสอบสิทธิ์การเป็นเจ้าของร้านค้า</p>
          
          {/* PIN Dots Indicators */}
          <div className="flex justify-center gap-4 my-8">
            {[0, 1, 2, 3].map((idx) => (
              <div 
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  pinInput.length > idx 
                    ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-md shadow-indigo-500/50' 
                    : 'border-slate-500 bg-transparent'
                }`}
              ></div>
            ))}
          </div>

          {pinErrorMessage && (
            <p className="text-xs font-bold text-rose-400 mb-6 animate-pulse">{pinErrorMessage}</p>
          )}

          {/* Virtual Numeric Pad */}
          <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (pinInput.length < 4) {
                    const nextInput = pinInput + num;
                    setPinInput(nextInput);
                    if (nextInput.length === 4) {
                      setTimeout(() => handleVerifyPin(nextInput), 150);
                    }
                  }
                }}
                className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 active:bg-white/25 text-xl font-bold text-white transition-all flex items-center justify-center cursor-pointer select-none"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPinInput('')}
              className="w-16 h-16 rounded-full bg-transparent text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer select-none"
            >
              เคลียร์
            </button>
            <button
              type="button"
              onClick={() => {
                if (pinInput.length < 4) {
                  const nextInput = pinInput + '0';
                  setPinInput(nextInput);
                  if (nextInput.length === 4) {
                    setTimeout(() => handleVerifyPin(nextInput), 150);
                  }
                }
              }}
              className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 active:bg-white/25 text-xl font-bold text-white transition-all flex items-center justify-center cursor-pointer select-none"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPinInput(prev => prev.slice(0, -1))}
              className="w-16 h-16 rounded-full bg-transparent text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer select-none"
            >
              ลบ
            </button>
          </div>
        </div>

        {/* Global Shake Keyframes Style */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
            20%, 40%, 60%, 80% { transform: translateX(6px); }
          }
          .animate-shake {
            animation: shake 0.4s ease-in-out;
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row min-h-[calc(100vh-64px)] font-sans bg-slate-50/50">
      
      {/* Mobile Header for Sidebar Toggle */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 p-4 sticky top-[64px] z-40">
        <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
          ระบบจัดการร้านค้า
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-premium"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${isMobileMenuOpen ? 'flex' : 'hidden'} 
        md:flex flex-col w-full md:w-64 bg-white border-r border-slate-200 shrink-0
        fixed md:sticky left-0 top-[125px] md:top-[64px] z-30 h-[calc(100dvh-125px)] md:h-[calc(100vh-64px)] overflow-y-auto shadow-sm md:shadow-none
      `}>
        <div className="p-5 border-b border-slate-100 hidden md:block">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            ผู้ดูแลระบบ
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">ยินดีต้อนรับ: <strong className="text-slate-800">{adminUser.username}</strong></p>
        </div>

        <nav className="flex flex-col p-3 pb-24 gap-1.5 flex-1">
          <button 
            onClick={() => { setActiveTab('stats'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'stats' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            สรุปยอดขายและสถิติ
          </button>
          <button 
            onClick={() => {
              setActiveTab('products');
              setNewProdType('ACCOUNT');
              setProductCategoryFilter('');
              setProductSearchQuery('');
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'products' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            จัดการแอปพรีเมี่ยม
          </button>
          <button
            onClick={() => {
              setActiveTab('games');
              setNewProdType('TOPUP');
              setProductCategoryFilter('');
              setProductSearchQuery('');
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'games' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Gamepad2 className="w-4.5 h-4.5" />
            จัดการเกม
          </button>
          <button 
            onClick={() => { setActiveTab('stock'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'stock' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Database className="w-4.5 h-4.5" />
            เติมคีย์สต๊อกสินค้า
          </button>
          <button 
            onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            ปรับยศสมาชิก
          </button>
          <button 
            onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'orders' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <History className="w-4.5 h-4.5" />
            ประวัติการขาย
          </button>
          
          <div className="mt-4 mb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            จัดการหน้าเว็บ
          </div>
          
          <button 
            onClick={() => { setActiveTab('ctacards'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'ctacards' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            แบนเนอร์ & กล่องแนะนำ
          </button>
          <button 
            onClick={() => { setActiveTab('depositSettings'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'depositSettings' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4.5 h-4.5" />
            ตั้งค่าระบบเติมเงิน
          </button>
          <button 
            onClick={() => { setActiveTab('lineSettings'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'lineSettings' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            ตั้งค่าแจ้งเตือน LINE Bot
          </button>
          <button 
            onClick={() => { setActiveTab('siteSettings'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'siteSettings' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4.5 h-4.5" />
            ตั้งค่าร้านค้า (โลโก้/ชื่อ)
          </button>

          <div className="mt-4 mb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ระบบ OTP
          </div>

          <button 
            onClick={() => { setActiveTab('emailSettings'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-premium cursor-pointer ${
              activeTab === 'emailSettings' ? 'bg-purple-50 text-purple-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4.5 h-4.5" />
            จัดการอีเมล IMAP (OTP)
          </button>

        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0 p-4 md:p-8">
        
        {/* Message Notifications */}
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700 font-medium animate-fadeIn">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-medium animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* --- TAB VIEW CONTENTS --- */}
        
        {/* 1. STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">รายได้ทั้งหมด</p>
                  <h3 className="text-xl font-black text-slate-800">{totalRevenue.toLocaleString()} ฿</h3>
                </div>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">จำนวนออเดอร์สำเร็จ</p>
                  <h3 className="text-xl font-black text-slate-800">{completedOrders.length} ออเดอร์</h3>
                </div>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">จำนวนชิ้นที่ขายแล้ว</p>
                  <h3 className="text-xl font-black text-slate-800">{totalItemsSold} ชิ้น</h3>
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue Chart */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-800 mb-6 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  สรุปยอดขายรายวัน (7 วันล่าสุดที่มีรายการ)
                </h3>
                {dailyStatsArray.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">ยังไม่มียอดขายรายวันในระบบ</p>
                ) : (
                  <div className="flex items-end justify-between gap-2 h-48 pt-4">
                    {dailyStatsArray.map((day, i) => {
                      const maxVal = Math.max(...dailyStatsArray.map(d => d.revenue)) || 1;
                      const pct = (day.revenue / maxVal) * 80; // Scale to max 80% height
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 group">
                          {/* Hover tooltip */}
                          <span className="text-[9px] font-bold bg-slate-900 text-white rounded px-1.5 py-0.5 mb-1.5 opacity-0 group-hover:opacity-100 transition-premium shadow-sm">
                            {day.revenue} ฿
                          </span>
                          <div 
                            style={{ height: `${Math.max(pct, 5)}%` }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-t-lg transition-premium cursor-pointer"
                          ></div>
                          <span className="text-[9px] font-semibold text-slate-400 mt-2 truncate max-w-full">
                            {day.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Monthly Revenue Chart */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-800 mb-6 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  สรุปยอดขายรายเดือน
                </h3>
                {monthlyStatsArray.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">ยังไม่มียอดขายรายเดือนในระบบ</p>
                ) : (
                  <div className="flex items-end justify-between gap-4 h-48 pt-4">
                    {monthlyStatsArray.map((mon, i) => {
                      const maxVal = Math.max(...monthlyStatsArray.map(m => m.revenue)) || 1;
                      const pct = (mon.revenue / maxVal) * 80;
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 group">
                          <span className="text-[9px] font-bold bg-slate-900 text-white rounded px-1.5 py-0.5 mb-1.5 opacity-0 group-hover:opacity-100 transition-premium shadow-sm">
                            {mon.revenue} ฿
                          </span>
                          <div 
                            style={{ height: `${Math.max(pct, 5)}%` }}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-premium cursor-pointer"
                          ></div>
                          <span className="text-[9px] font-semibold text-slate-400 mt-2 truncate">
                            {mon.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS / GAMES TAB (CRUD Forms) */}
        {(activeTab === 'products' || activeTab === 'games') && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Top Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Forms column (Add Category & Subcategory) */}
              <div className="lg:col-span-1 space-y-6">
              
              {/* Category creation/edit form */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-500" />
                  {editingCatId ? 'แก้ไขหมวดหมู่หลัก' : 'สร้างหมวดหมู่หลักใหม่'}
                </h3>
                <form onSubmit={handleSaveCategory} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">ชื่อหมวดหมู่</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น Netflix Premium" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">ลิงก์ภาพหมวดหมู่ (แนะนำ: 500x500 px) / อัปโหลดรูปภาพ</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        placeholder="ป้อน URL รูปภาพหน้าปก หรืออัปโหลดไฟล์ (แนะนำ: 500x500 px)" 
                        value={newCatImage}
                        onChange={(e) => setNewCatImage(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all select-none border border-slate-200 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingField === 'cat' ? 'อัปโหลด...' : 'อัปโหลด'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleUploadImage(e, 'cat')} 
                          disabled={uploadingField !== null}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-indigo-500 font-medium mt-1">แนะนำ: อัตราส่วน 1:1 ทรงจัตุรัส (เช่น 500x500 พิกเซล)</p>
                    {newCatImage && (
                      <div className="mt-2 p-1.5 border border-slate-100 rounded-xl bg-slate-50/50 w-fit">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">ตัวอย่างรูปหมวดหมู่:</span>
                        <img 
                          src={newCatImage} 
                          alt="Category Preview" 
                          className="w-16 h-16 object-cover bg-white border border-slate-200 rounded-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/100x100?text=Invalid+Image';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {editingCatId && (
                      <button 
                        type="button" 
                        onClick={handleCancelEditCategory}
                        className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-premium cursor-pointer border border-slate-200"
                      >
                        ยกเลิก
                      </button>
                    )}
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className={`py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-premium cursor-pointer ${
                        editingCatId ? 'w-2/3' : 'w-full'
                      }`}
                    >
                      {editingCatId ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'}
                    </button>
                  </div>
                </form>

                {/* Categories list */}
                {categories.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 max-h-48 overflow-y-auto space-y-2">
                    {(() => {
                      const listCats = categories.filter(c => {
                        const isGame = c.id.endsWith('_cat');
                        return isGameManager ? isGame : !isGame;
                      });
                      return (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">
                            {isGameManager ? 'หมวดหมู่เกมทั้งหมด' : 'หมวดหมู่แอปทั้งหมด'} ({listCats.length})
                          </span>
                          {listCats.map(c => (
                            <div key={c.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2 min-w-0">
                                {c.image ? (
                                  <img src={c.image} alt={c.name} className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0" />
                                ) : (
                                  <div className="w-6 h-6 rounded-md bg-slate-200 shrink-0" />
                                )}
                                <span className="text-[10px] font-bold text-slate-700 truncate">{c.name}</span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button 
                                  type="button"
                                  onClick={() => handleStartEditCategory(c)}
                                  className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition-all cursor-pointer"
                                  title="แก้ไขหมวดหมู่"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteCategory(c.id)}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all cursor-pointer"
                                  title="ลบหมวดหมู่"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Subcategory creation form */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-blue-500" />
                  สร้างหมวดหมู่ย่อยใหม่
                </h3>
                <form onSubmit={handleCreateSubcategory} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">หมวดหมู่หลัก</label>
                    <select 
                      value={newSubcatParentId}
                      onChange={(e) => setNewSubcatParentId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">ชื่อหมวดหมู่ย่อย</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น NF รายวัน" 
                      value={newSubcatName}
                      onChange={(e) => setNewSubcatName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">ลิงก์ภาพหมวดหมู่ย่อย (แนะนำ: 500x500 px) / อัปโหลด</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        placeholder="ป้อน URL รูปภาพ หรืออัปโหลดไฟล์ (แนะนำ: 500x500 px)" 
                        value={newSubcatImage}
                        onChange={(e) => setNewSubcatImage(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all select-none border border-slate-200 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingField === 'subcat' ? 'อัปโหลด...' : 'อัปโหลด'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleUploadImage(e, 'subcat')} 
                          disabled={uploadingField !== null}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-blue-600 font-medium mt-1">แนะนำ: อัตราส่วน 1:1 ทรงจัตุรัส (เช่น 500x500 พิกเซล)</p>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-premium cursor-pointer"
                  >
                    สร้างหมวดหมู่ย่อย
                  </button>
                </form>

                {/* Subcategories list */}
                {subcategories.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 max-h-48 overflow-y-auto space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">หมวดหมู่ย่อยทั้งหมด ({subcategories.length})</span>
                    {subcategories.map(s => {
                      const parent = categories.find(c => c.id === s.categoryId);
                      return (
                        <div key={s.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-700 block truncate">{s.name}</span>
                            <span className="text-[9px] text-slate-400 block">{parent?.name || 'ไม่มีหมวดหมู่หลัก'}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleDeleteSubcategory(s.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Forms column (Add Product & Options) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Product creation form */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-500" />
                  {editingProdId ? 'แก้ไขสินค้า' : isGameManager ? 'เพิ่มเกมใหม่' : 'เพิ่มแอปพรีเมี่ยมใหม่'}
                </h3>

                {/* Option Creation Guide Box */}
                <div className="mb-4 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-950 font-medium">
                  <p className="font-bold flex items-center gap-1 text-indigo-600 mb-1">
                    💡 วิธีลงสินค้าแบบมีปุ่มตัวเลือกย่อย (เช่น Netflix)
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    หากต้องการลงสินค้าแบบมีหลายราคา/หลายตัวเลือกให้ลูกค้าคลิกเลือกในหน้ารายละเอียดสินค้าชิ้นเดียว:
                  </p>
                  <ol className="list-decimal pl-4 mt-1.5 space-y-1 text-slate-600">
                    <li>กรอกฟอร์มด้านล่างสร้าง <strong>สินค้าหลัก 1 ชิ้นก่อน</strong> (เช่น ชื่อ "Wetv 30 วัน หาร 4")</li>
                    <li>เมื่อกดสร้างแล้ว ให้ไปดูตารางขวามือ แล้วกดปุ่ม <strong>แก้ไข (✏️ ดินสอสีม่วง)</strong> ที่สินค้านั้น</li>
                    <li>จะมีกล่อง <strong>"จัดการตัวเลือกสินค้า"</strong> แสดงขึ้นมาใต้กล่องนี้ ให้กรอกเพิ่มตัวเลือกทีละอัน (เช่น "we 3" ราคา 20 บาท, ";/kl;kl" ราคา 11 บาท)</li>
                    <li>ไปที่แท็บ <strong>"เติมคีย์สต๊อกสินค้า"</strong> เลือกสินค้าและตัวเลือกย่อยที่สร้างไว้ แล้ววางคีย์สต๊อกตามปกติ</li>
                  </ol>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">ชื่อสินค้า</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น Netflix 30 วัน จอส่วนตัว" 
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">รายละเอียดสินค้า</label>
                    <textarea 
                      required
                      rows="2"
                      placeholder="ระบุข้อความอธิบายสินค้า..." 
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">ราคาปกติ (บาท)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        placeholder="150" 
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">ราคาส่งตัวแทน (บาท)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        placeholder="120" 
                        value={newProdAgentPrice}
                        onChange={(e) => setNewProdAgentPrice(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">ประเภทสินค้า</label>
                      <select 
                        value={newProdType}
                        onChange={(e) => setNewProdType(e.target.value)}
                        disabled={activeTab === 'products' || activeTab === 'games'}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                      >
                        <option value="ACCOUNT">แอปพรีเมี่ยม/คีย์ส่งออโต้</option>
                        <option value="TOPUP">เกม/ระบบเติมอัตโนมัติ</option>
                      </select>
                      {(activeTab === 'products' || activeTab === 'games') && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isGameManager ? 'ล็อกเป็นประเภทเกม เพื่อแยกจากแอปพรีเมี่ยม' : 'ล็อกเป็นประเภทแอปพรีเมี่ยม เพื่อไม่ปนกับเกม'}
                        </p>
                      )}
                    </div>
                  </div>
                  {newProdType === 'TOPUP' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-700 mb-1">WonDD servicecode</label>
                        <input
                          type="text"
                          placeholder="เช่น rov, freefire, undawn"
                          value={newProdGameServiceCode}
                          onChange={(e) => setNewProdGameServiceCode(e.target.value)}
                          className="w-full px-3 py-1.5 border border-emerald-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-700 mb-1">WonDD packcode หลัก</label>
                        <input
                          type="text"
                          placeholder="ใส่เมื่อไม่มีตัวเลือกราคา เช่น R00011"
                          value={newProdExternalPackCode}
                          onChange={(e) => setNewProdExternalPackCode(e.target.value)}
                          className="w-full px-3 py-1.5 border border-emerald-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">ลิงก์ภาพสินค้า (แนะนำ: 500x500 px) / อัปโหลดรูปภาพ</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        required
                        placeholder="ป้อน URL รูปภาพสินค้า หรืออัปโหลดไฟล์ (แนะนำ: 500x500 px)" 
                        value={newProdImage}
                        onChange={(e) => setNewProdImage(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all select-none border border-slate-200 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingField === 'prod' ? 'อัปโหลด...' : 'อัปโหลด'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleUploadImage(e, 'prod')} 
                          disabled={uploadingField !== null}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-indigo-500 font-medium mt-1">แนะนำ: อัตราส่วน 1:1 ทรงจัตุรัส (เช่น 500x500 พิกเซล)</p>
                    {newProdImage && (
                      <div className="mt-2 p-1.5 border border-slate-100 rounded-xl bg-slate-50/50 w-fit">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">ตัวอย่างรูปสินค้า:</span>
                        <img 
                          src={newProdImage} 
                          alt="Product Preview" 
                          className="w-16 h-16 object-cover bg-white border border-slate-200 rounded-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/100x100?text=Invalid+Image';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">เลือกหมวดหมู่</label>
                    <select 
                      value={newProdCatId}
                      onChange={(e) => setNewProdCatId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                    >
                      {visibleProductCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Subcategory Selector */}
                  {subcategories.filter(s => s.categoryId === newProdCatId).length > 0 && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">เลือกหมวดหมู่ย่อย (ถ้ามี)</label>
                      <select 
                        value={newProdSubCatId}
                        onChange={(e) => setNewProdSubCatId(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                      >
                        <option value="">-- ไม่เลือก (แสดงโดยตรง) --</option>
                        {subcategories.filter(s => s.categoryId === newProdCatId).map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {editingProdId && (
                      <button 
                        type="button" 
                        onClick={handleCancelEditProduct}
                        className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-premium cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    )}
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className={`py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-premium cursor-pointer ${
                        editingProdId ? 'w-2/3' : 'w-full'
                      }`}
                    >
                      {editingProdId ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้าใหม่'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Manage Options Box */}
              {editingProdId && (
                <div className="bg-white border border-slate-200/50 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-blue-500" />
                    จัดการตัวเลือกสินค้า
                  </h3>
                  
                  <form onSubmit={handleCreateOption} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">ชื่อตัวเลือกสินค้า</label>
                      <input 
                        type="text" 
                        required
                        placeholder="เช่น จอมือถือ" 
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">ราคาปกติ (บาท)</label>
                        <input 
                          type="number" 
                          required
                          placeholder="15" 
                          value={newOptionPrice}
                          onChange={(e) => setNewOptionPrice(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">ราคาส่งตัวแทน (บาท)</label>
                        <input 
                          type="number" 
                          required
                          placeholder="12" 
                          value={newOptionAgentPrice}
                          onChange={(e) => setNewOptionAgentPrice(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">WonDD packcode</label>
                        <input
                          type="text"
                          placeholder="เช่น R00012"
                          value={newOptionExternalPackCode}
                          onChange={(e) => setNewOptionExternalPackCode(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">ลำดับแสดงผล (น้อยขึ้นก่อน)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={newOptionPosition}
                          onChange={(e) => setNewOptionPosition(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-premium cursor-pointer"
                      >
                        {editingOptionId ? 'บันทึกการแก้ไข' : 'เพิ่มตัวเลือกย่อยนี้'}
                      </button>
                      {editingOptionId && (
                        <button 
                          type="button" 
                          onClick={handleCancelEditOption}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-premium cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Options List */}
                  {(() => {
                    const currentProd = products.find(p => p.id === editingProdId);
                    const optionsList = [...(currentProd?.options || [])].sort((a, b) => {
                      if ((a.position || 0) !== (b.position || 0)) {
                        return (a.position || 0) - (b.position || 0);
                      }
                      return a.price - b.price;
                    });
                    if (optionsList.length > 0) {
                      return (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block mb-2">ตัวเลือกที่มีอยู่ ({optionsList.length})</span>
                          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                            <table className="w-full text-xs text-left border-collapse bg-white">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[9px] sticky top-0 z-10">
                                  <th className="py-2 px-1 text-center w-8">ย้าย</th>
                                  <th className="py-2 px-2 min-w-[120px]">ชื่อตัวเลือก</th>
                                  <th className="py-2 px-2 w-20">ราคาทั่วไป (฿)</th>
                                  <th className="py-2 px-2 w-20">ราคาส่ง (฿)</th>
                                  <th className="py-2 px-2 w-28">Packcode (WonDD)</th>
                                  <th className="py-2 px-2 w-14 text-center">ลำดับ</th>
                                  <th className="py-2 px-2 w-16 text-center">จัดการ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {optionsList.map((opt, idx) => {
                                  const edited = inlineOptionsData[opt.id] || {
                                    name: opt.name,
                                    price: opt.price,
                                    agentPrice: opt.agentPrice || 0,
                                    externalPackCode: opt.externalPackCode || '',
                                    position: opt.position || 0
                                  };
                                  const hasChanged = isOptionChanged(opt);
                                  
                                  return (
                                    <tr 
                                      key={opt.id} 
                                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition ${
                                        draggedIdx === idx ? 'opacity-40 bg-slate-100' : ''
                                      }`}
                                      onDragOver={(e) => handleDragOver(e, idx)}
                                      onDrop={(e) => handleDrop(e, idx, optionsList)}
                                    >
                                      {/* Drag Handle */}
                                      <td 
                                        className="py-1 px-1 text-center cursor-grab active:cursor-grabbing select-none"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                      >
                                        <GripVertical className="w-4 h-4 text-slate-400 mx-auto" />
                                      </td>

                                      {/* Option Name Input */}
                                      <td className="py-1 px-2">
                                        <input
                                          type="text"
                                          value={edited.name}
                                          onChange={(e) => handleInlineChange(opt.id, 'name', e.target.value)}
                                          className="w-full px-2 py-0.5 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-blue-500 font-medium text-xs"
                                        />
                                      </td>

                                      {/* Price Input */}
                                      <td className="py-1 px-2">
                                        <input
                                          type="number"
                                          value={edited.price}
                                          onChange={(e) => handleInlineChange(opt.id, 'price', e.target.value)}
                                          className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-slate-700 text-right focus:outline-none focus:border-blue-500 font-medium text-xs"
                                        />
                                      </td>

                                      {/* Agent Price Input */}
                                      <td className="py-1 px-2">
                                        <input
                                          type="number"
                                          value={edited.agentPrice}
                                          onChange={(e) => handleInlineChange(opt.id, 'agentPrice', e.target.value)}
                                          className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-slate-700 text-right focus:outline-none focus:border-blue-500 font-medium text-xs"
                                        />
                                      </td>

                                      {/* Packcode Input */}
                                      <td className="py-1 px-2">
                                        <input
                                          type="text"
                                          value={edited.externalPackCode}
                                          onChange={(e) => handleInlineChange(opt.id, 'externalPackCode', e.target.value)}
                                          className="w-full px-2 py-0.5 border border-slate-200 rounded text-slate-700 font-mono focus:outline-none focus:border-blue-500 text-xs"
                                          placeholder="ไม่มี"
                                        />
                                      </td>

                                      {/* Position Input */}
                                      <td className="py-1 px-2">
                                        <input
                                          type="number"
                                          value={edited.position}
                                          onChange={(e) => handleInlineChange(opt.id, 'position', parseInt(e.target.value) || 0)}
                                          className="w-10 px-1 py-0.5 border border-slate-200 rounded text-center focus:outline-none focus:border-blue-500 mx-auto block font-semibold text-xs"
                                        />
                                      </td>

                                      {/* Action Buttons */}
                                      <td className="py-1 px-2 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          {hasChanged ? (
                                            <button
                                              type="button"
                                              onClick={() => handleSaveInlineOption(opt.id)}
                                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer"
                                              title="บันทึกการแก้ไขตัวเลือกนี้"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                          ) : (
                                            <div className="w-5.5 h-5.5" />
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteOption(opt.id)}
                                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                            title="ลบตัวเลือก"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p className="text-[10px] text-slate-400 mt-4 text-center">ยังไม่มีการเพิ่มตัวเลือกสำหรับสินค้านี้</p>
                    );
                  })()}
                </div>
              )}

            </div>
          </div>

          {/* Bottom Section: Existing Products List (Show existing products in full width) */}
          <div className="w-full bg-white border border-slate-200/50 rounded-2xl p-5 overflow-hidden flex flex-col">
              <div className="flex flex-col gap-3 mb-4">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  {isGameManager ? (
                    <Gamepad2 className="w-4.5 h-4.5 text-indigo-500" />
                  ) : (
                    <Package className="w-4.5 h-4.5 text-indigo-500" />
                  )}
                  {isGameManager ? 'รายการเกมในระบบ' : 'รายการแอปพรีเมี่ยมในระบบ'}
                </h3>
                
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="🔍 ค้นหาชื่อสินค้า หรือรายละเอียด..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 font-medium"
                    />
                    {productSearchQuery && (
                      <button 
                        onClick={() => setProductSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="w-full sm:w-52">
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 font-medium"
                    >
                      <option value="">{isGameManager ? '🎮 ทุกหมวดหมู่เกม' : '📂 ทุกหมวดหมู่แอป'}</option>
                      {visibleCategoryFilters.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                      <th className="py-2.5">ภาพ</th>
                      <th className="py-2.5">ชื่อสินค้า</th>
                      <th className="py-2.5">หมวดหมู่</th>
                      <th className="py-2.5 text-right">ราคา</th>
                      <th className="py-2.5 text-center">คลังคงเหลือ</th>
                      <th className="py-2.5 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredProducts = managedProducts.filter(prod => {
                        const matchesSearch = prod.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
                                              (prod.description || '').toLowerCase().includes(productSearchQuery.toLowerCase());
                        const matchesCategory = !productCategoryFilter || prod.categoryId === productCategoryFilter;
                        return matchesSearch && matchesCategory;
                      });

                      if (filteredProducts.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-xs text-slate-400">
                              ไม่พบสินค้าที่ตรงตามเงื่อนไขค้นหา
                            </td>
                          </tr>
                        );
                      }

                      return filteredProducts.map((prod) => (
                        <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2">
                            <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-md object-cover border border-slate-100" />
                          </td>
                          <td className="py-2 font-bold text-slate-700">{prod.name}</td>
                          <td className="py-2 text-slate-500">{prod.categoryName}</td>
                          <td className="py-2 text-right font-bold text-slate-700">
                            <div>ทั่วไป: {prod.price} ฿</div>
                            <div className="text-[10px] text-purple-600">ส่ง: {prod.agentPrice || 0} ฿</div>
                          </td>
                          <td className="py-2 text-center">
                            {prod.type === 'TOPUP' ? (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">
                                เติมเงินออโต้
                              </span>
                            ) : (
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                prod.stockCount === 0 
                                  ? 'bg-red-50 text-red-600' 
                                  : prod.stockCount < 3 
                                    ? 'bg-amber-50 text-amber-600' 
                                    : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {prod.stockCount} ชิ้น
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => handleStartEditProduct(prod)}
                                className="p-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-premium cursor-pointer"
                                title="แก้ไขสินค้า"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1 rounded-md bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-premium cursor-pointer"
                                title="ลบสินค้า"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. STOCK TAB (Paste line-by-line) */}
        {activeTab === 'stock' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Left Column: Replenish Form (Span 1) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                  <Database className="w-4.5 h-4.5 text-indigo-500" />
                  เติมคีย์สต๊อกสินค้า (ACCOUNT/KEY)
                </h3>
                
                <form onSubmit={handleAddStock} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">เลือกสินค้าที่ต้องการเติมคีย์</label>
                    <select 
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    >
                      {products
                        .filter(p => p.type === 'ACCOUNT')
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name} (ในคลังมีอยู่ {p.stockCount} ชิ้น)</option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Product Option Selector for Stock */}
                  {(() => {
                    const selectedProductForStock = products.find(p => p.id === selectedProdId);
                    const hasOptions = selectedProductForStock?.options && selectedProductForStock.options.length > 0;
                    if (!hasOptions) return null;
                    return (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">เลือกตัวเลือกของสินค้าที่ต้องการเติมคีย์</label>
                        <select 
                          value={selectedOptionIdForStock}
                          onChange={(e) => setSelectedOptionIdForStock(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        >
                          <option value="">-- ไม่ระบุตัวเลือก (แสดงแบบสินค้าเดี่ยว) --</option>
                          {selectedProductForStock.options.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name} ({opt.price} บาท)</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">รูปแบบการแบ่งรายการสต๊อก</label>
                    <div className="grid grid-cols-2 gap-2 mb-3 select-none">
                      <button
                        type="button"
                        onClick={() => setSplitMode('line')}
                        className={`px-3 py-2 text-left rounded-xl border transition-all cursor-pointer ${
                          splitMode === 'line' 
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="text-[10px]">1 บรรทัด = 1 สต๊อก</div>
                        <div className="text-[8px] opacity-80 font-normal mt-0.5">แบ่งรายการทุกๆ ขึ้นบรรทัดใหม่</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitMode('blank')}
                        className={`px-3 py-2 text-left rounded-xl border transition-all cursor-pointer ${
                          splitMode === 'blank' 
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="text-[10px]">เว้นบรรทัดว่าง = แยกสต๊อก</div>
                        <div className="text-[8px] opacity-80 font-normal mt-0.5">1 รายการมีได้หลายบรรทัด</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitMode('delimiter')}
                        className={`px-3 py-2 text-left rounded-xl border transition-all cursor-pointer ${
                          splitMode === 'delimiter' 
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="text-[10px]">แยกด้วยเครื่องหมาย ---</div>
                        <div className="text-[8px] opacity-80 font-normal mt-0.5">ใช้บรรทัด --- เพื่อแยกคีย์</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitMode('none')}
                        className={`px-3 py-2 text-left rounded-xl border transition-all cursor-pointer ${
                          splitMode === 'none' 
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="text-[10px]">ทั้งหมด = 1 สต๊อก</div>
                        <div className="text-[8px] opacity-80 font-normal mt-0.5">ไม่แยก ทุกบรรทัดคือคีย์เดียวกัน</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      {splitMode === 'line' && 'ป้อนรหัสคีย์สินค้า (วางทีละบรรทัด)'}
                      {splitMode === 'blank' && 'ป้อนคีย์สต๊อกแบบหลายบรรทัด (เว้นบรรทัดว่างเพื่อแยกแต่ละชิ้น)'}
                      {splitMode === 'delimiter' && 'ป้อนคีย์สต๊อกแบบหลายบรรทัด (ใช้ --- เพื่อแยกแต่ละชิ้น)'}
                      {splitMode === 'none' && 'ป้อนรายละเอียดคีย์สต๊อกแบบหลายบรรทัด (ทั้งหมดนี้จะนับเป็น 1 สต๊อก)'}
                    </label>
                    <p className="text-[9px] text-slate-400 mb-1 font-light">
                      {splitMode === 'line' && '1 บรรทัดจะเท่ากับสต๊อกสินค้า 1 ชิ้น เช่น: email:password หรือ รหัสคีย์'}
                      {splitMode === 'blank' && 'แต่ละสต๊อกมีหลายบรรทัดได้ โดยเว้น 1 บรรทัดว่างเพื่อเริ่มสต๊อกถัดไป'}
                      {splitMode === 'delimiter' && 'แต่ละสต๊อกมีหลายบรรทัดได้ โดยใส่ --- คั่นกลางระหว่างสต๊อก'}
                      {splitMode === 'none' && 'ข้อความทั้งหมดในกล่องจะถูกส่งให้ลูกค้าเป็น 1 รายการสั่งซื้อ'}
                    </p>
                    <textarea 
                      required
                      rows="8"
                      placeholder={
                        splitMode === 'line' ? "เช่น\nuser1@netflix.com:pass123\nuser2@netflix.com:pass456" :
                        splitMode === 'blank' ? "ตัวอย่างการพิมพ์:\nอีเมล: client1@test.com\nรหัสผ่าน: pass123\n\nอีเมล: client2@test.com\nรหัสผ่าน: pass456" :
                        splitMode === 'delimiter' ? "ตัวอย่างการพิมพ์:\nอีเมล: client1@test.com\nรหัสผ่าน: pass123\n---\nอีเมล: client2@test.com\nรหัสผ่าน: pass456" :
                        "ตัวอย่างการพิมพ์:\nอีเมล: client@test.com\nรหัสผ่าน: pass1234\nหมายเหตุ: ห้ามเปลี่ยนแปลงข้อมูลบัญชีเด็ดขาด"
                      }
                      value={stockLines}
                      onChange={(e) => setStockLines(e.target.value)}
                      className="w-full px-3 py-2 font-mono border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  {/* Guide Image Uploader */}
                  <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-600">รูปภาพวิธีการเข้าใช้งาน / คำแนะนำเพิ่มเติม (ไม่บังคับ)</label>
                    <div className="flex items-center gap-3">
                      {guideImageUrl ? (
                        <div className="w-14 h-14 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 relative group">
                          <img src={guideImageUrl} alt="Guide preview" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setGuideImageUrl('')} 
                            className="absolute inset-0 bg-black/60 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                          >
                            ลบรูป
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-[10px] text-slate-400 shrink-0 select-none">
                          ไม่มีรูป
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer transition-all">
                          {uploadingGuideImage ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพ...'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleGuideImageUpload} 
                            className="hidden" 
                            disabled={uploadingGuideImage} 
                          />
                        </label>
                        <p className="text-[8px] text-slate-400 mt-1">รูปจะแสดงคู่กับสต๊อกนี้เมื่อลูกค้าสั่งซื้อสำเร็จ</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading || !selectedProdId}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-premium shadow-xs cursor-pointer"
                  >
                    บันทึกการเติมสต๊อก
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Manage Stock Items List (Span 2) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <List className="w-4 h-4 text-indigo-500" />
                      รายการคีย์ในคลังที่ยังไม่ได้ขาย
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      แสดงรายการสินค้าที่ยังไม่มีผู้ซื้อ คุณสามารถลบออกได้หากป้อนผิดพลาด
                    </p>
                  </div>
                  {stockItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearAllStock(selectedProdId, selectedOptionIdForStock)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-red-200/40"
                    >
                      <Trash2 className="w-3 h-3" />
                      ล้างคลังทั้งหมด ({stockItems.length} ชิ้น)
                    </button>
                  )}
                </div>

                {isLoadingStock ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="text-xs">กำลังโหลดรายการคีย์ในคลัง...</span>
                  </div>
                ) : stockItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    ไม่มีรายการคีย์ค้างในคลังสำหรับตัวเลือกนี้
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[450px] overflow-y-auto pr-1">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                          <th className="py-2.5">คีย์ / ข้อมูลสินค้าในสต๊อก</th>
                          <th className="py-2.5">วันที่เติมสต๊อก</th>
                          <th className="py-2.5 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockItems.map((item) => (
                          <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-2 font-mono text-[11px] text-slate-700 break-all select-all pr-4">
                              <div className="flex flex-col gap-1">
                                <span>{item.content}</span>
                                {item.guideImage && (
                                  <button 
                                    type="button"
                                    onClick={() => setLightboxImageUrl(item.guideImage)}
                                    className="text-[9px] text-indigo-500 font-bold hover:text-indigo-700 hover:underline w-fit flex items-center gap-0.5 cursor-pointer bg-transparent border-0 p-0"
                                  >
                                    🖼️ ดูรูปวิธีการเข้า
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-2 text-[10px] text-slate-400">
                              {new Date(item.createdAt).toLocaleString('th-TH')}
                            </td>
                            <td className="py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteStockItem(item.id)}
                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all cursor-pointer inline-flex items-center"
                                title="ลบรายการนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. USER ROLE MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200/50 rounded-2xl p-5 overflow-hidden animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-indigo-500" />
              จัดการสิทธิ์การเข้าถึง / ปรับยศสมาชิก
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="py-2.5">ชื่อผู้ใช้งาน</th>
                    <th className="py-2.5 text-center">ยศ/บทบาท</th>
                    <th className="py-2.5">วันที่สมัคร</th>
                    <th className="py-2.5 text-center">เครื่องมือจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-700">{u.username}</td>
                      <td className="py-3 text-center">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          u.role === 'ADMIN' 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : u.role === 'AGENT'
                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="py-3 text-center">
                        {u.id === adminUser.userId ? (
                          <span className="text-[10px] text-slate-400 font-semibold italic">บัญชีปัจจุบัน</span>
                        ) : (
                          <select 
                            value={u.role}
                            onChange={(e) => handleToggleUserRole(u.id, e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="USER">USER</option>
                            <option value="AGENT">AGENT (ตัวแทน)</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. ORDER HISTORY TAB */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200/50 rounded-2xl p-5 overflow-hidden animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
              <History className="w-4.5 h-4.5 text-indigo-500" />
              บันทึกรายการคำสั่งซื้อและการจัดส่ง
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="py-2.5">เลขออเดอร์</th>
                    <th className="py-2.5">สินค้า</th>
                    <th className="py-2.5 text-center">จำนวน</th>
                    <th className="py-2.5 text-right">ยอดรวม</th>
                    <th className="py-2.5 text-center">สถานะ</th>
                    <th className="py-2.5">คีย์ที่จัดส่ง / ข้อมูลอ้างอิง</th>
                    <th className="py-2.5">วันเวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 font-mono text-slate-500 font-bold">{o.id}</td>
                      <td className="py-3 font-bold text-slate-700">{o.productName}</td>
                      <td className="py-3 text-center text-slate-600">{o.quantity} ชิ้น</td>
                      <td className="py-3 text-right font-bold text-indigo-600">{o.totalPrice} ฿</td>
                      <td className="py-3 text-center">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          ชำระเงินแล้ว
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">
                        {o.targetId ? (
                          <span className="text-[10px] text-indigo-600 font-medium">UID: {o.targetId}</span>
                        ) : (
                          <code className="text-[10px] font-mono bg-slate-50 border border-slate-100 px-1 py-0.5 rounded text-slate-600 break-all select-all">
                            {o.content}
                          </code>
                        )}
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(o.createdAt).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. CTA CARDS & CAROUSEL MANAGEMENT TAB */}
        {activeTab === 'ctacards' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 6.1. CAROUSEL SLIDES MANAGEMENT BLOCK */}
            <div className="bg-white border border-slate-200/50 rounded-2xl p-5 overflow-hidden space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4.5 h-4.5 text-indigo-500" />
                    จัดการภาพสไลด์โปรโมตหน้าแรก (Carousel Banner)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">คุณสามารถอัปโหลดรูปภาพหรือวิดีโอแอนิเมชันเพื่อแสดงเป็นแบนเนอร์เต็มขนาดด้านบนสุดของหน้าแรกได้จากตรงนี้</p>
                </div>
                <button
                  onClick={handleAddCarouselSlide}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-premium cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มสไลด์แบนเนอร์ใหม่
                </button>
              </div>
              
              <div className="space-y-6">
                {editedCarouselSlides.map((slide, idx) => (
                  <div key={slide.id} className="border border-slate-200/60 rounded-xl p-5 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-indigo-600 uppercase">สไลด์แบนเนอร์ที่ {idx + 1}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateCarouselSlide(slide.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-premium cursor-pointer"
                        >
                          {isLoading ? 'กำลังบันทึก...' : 'บันทึกสไลด์นี้'}
                        </button>
                        <button
                          onClick={() => handleDeleteCarouselSlide(slide.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition-premium cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          ลบสไลด์นี้
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">ลิงก์ปลายทางเมื่อคลิกรูปภาพ/วิดีโอ (Link URL - ตัวเลือก)</label>
                        <input
                          type="text"
                          placeholder="เช่น /deposit หรือ /categories?id=... (ปล่อยว่างไว้ถ้าไม่ต้องการให้ลิงก์ไปไหน)"
                          value={slide.linkUrl || ''}
                          onChange={(e) => handleCarouselInputChange(slide.id, 'linkUrl', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>

                      {/* Image/Video & Preview Row */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">ลิงก์รูปภาพหรือวิดีโอ (แนะนำ: 1920x640 px) / อัปโหลดไฟล์รูปภาพหรือวิดีโอ</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={slide.image}
                            onChange={(e) => handleCarouselInputChange(slide.id, 'image', e.target.value)}
                            placeholder="เช่น /uploads/my-banner.png หรือ .mp4 (แนะนำ: 1920x640 px)"
                            className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                          />
                          <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all select-none border border-slate-200 shrink-0">
                            <Upload className="w-3 h-3" />
                            {uploadingField === `slide-${slide.id}` ? 'อัปโหลด...' : 'อัปโหลดไฟล์'}
                            <input 
                              type="file" 
                              accept="image/*,video/*" 
                              className="hidden" 
                              onChange={(e) => handleUploadImage(e, `slide-${slide.id}`, slide.id)} 
                              disabled={uploadingField !== null}
                            />
                          </label>
                        </div>
                        <p className="text-[9px] text-indigo-500 font-medium mt-1">แนะนำ: อัตราส่วน 3:1 ทรงสี่เหลี่ยมผืนผ้าแนวนอน (เช่น 1920x640 หรือ 1200x400 พิกเซล)</p>
                        {slide.image && (
                          <div className="mt-2 p-1.5 border border-slate-100 rounded-xl bg-slate-50/50 w-fit">
                            <span className="text-[8px] text-slate-400 font-bold block mb-1">ตัวอย่างไฟล์สื่อที่จะแสดงบนหน้าแรก:</span>
                            {(() => {
                              const isVideo = slide.image.endsWith('.mp4') || 
                                              slide.image.endsWith('.webm') || 
                                              slide.image.endsWith('.ogg') || 
                                              slide.image.endsWith('.mov') || 
                                              slide.image.endsWith('.m4v') ||
                                              slide.image.includes('/video/');
                              if (isVideo) {
                                return (
                                  <video 
                                    src={slide.image} 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    className="w-36 h-20 object-cover bg-white border border-slate-200 rounded-lg"
                                  />
                                );
                              } else {
                                return (
                                  <img 
                                    src={slide.image} 
                                    alt="Slide Preview" 
                                    className="w-36 h-20 object-cover bg-white border border-slate-200 rounded-lg"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://placehold.co/100x100?text=Invalid+Image';
                                    }}
                                  />
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6.2. CTA CARDS MANAGEMENT BLOCK */}
            <div className="bg-white border border-slate-200/50 rounded-2xl p-5 overflow-hidden space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4.5 h-4.5 text-indigo-500" />
                  จัดการกล่องแนะนำ (CTA) ทั้ง 4 กล่อง
                </h3>
                <p className="text-xs text-slate-400 mt-1">คุณสามารถเปลี่ยนรูปภาพ หัวข้อ คำอธิบาย และลิงก์ปลายทางของกล่องต่างๆ ได้จากตรงนี้</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {editedCards.map((card) => (
                  <div key={card.id} className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-indigo-600 uppercase">กล่องที่ {card.id.replace('card', '')} ({card.id})</span>
                      <button
                        onClick={() => handleUpdateCard(card.id)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-premium cursor-pointer"
                      >
                        {isLoading ? 'กำลังบันทึก...' : 'บันทึกกล่องนี้'}
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">หัวข้อกล่อง (Title)</label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => handleCardInputChange(card.id, 'title', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">คำอธิบายกล่อง (Description)</label>
                        <input
                          type="text"
                          value={card.description}
                          onChange={(e) => handleCardInputChange(card.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">ลิงก์รูปภาพ (แนะนำ: 800x450 px) / อัปโหลดรูปภาพ</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={card.imageUrl}
                            onChange={(e) => handleCardInputChange(card.id, 'imageUrl', e.target.value)}
                            placeholder="ป้อน URL รูปภาพ หรืออัปโหลดไฟล์ (แนะนำ: 800x450 px)" 
                            className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                          />
                          <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all select-none border border-slate-200 shrink-0">
                            <Upload className="w-3 h-3" />
                            {uploadingField === card.id ? 'อัปโหลด...' : 'อัปโหลด'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleUploadImage(e, card.id, card.id)} 
                              disabled={uploadingField !== null}
                            />
                          </label>
                        </div>
                        <p className="text-[9px] text-indigo-500 font-medium mt-1">แนะนำ: อัตราส่วน 16:9 หรือ 4:3 (เช่น 800x450 หรือ 800x600 พิกเซล)</p>
                        {card.imageUrl && (
                          <div className="mt-2 p-1.5 border border-slate-100 rounded-xl bg-slate-50/50 w-fit">
                            <span className="text-[8px] text-slate-400 font-bold block mb-1">ตัวอย่างรูปกล่องแนะนำ:</span>
                            <img 
                              src={card.imageUrl} 
                              alt="Card Preview" 
                              className="w-32 h-16 object-cover bg-white border border-slate-200 rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100?text=Invalid+Image';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">ลิงก์ปลายทาง (Redirect Link URL)</label>
                        <input
                          type="text"
                          value={card.linkUrl}
                          onChange={(e) => handleCardInputChange(card.id, 'linkUrl', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. DEPOSIT SETTINGS TAB */}
        {activeTab === 'depositSettings' && (
          <div className="bg-white border border-slate-200/50 rounded-2xl p-5 overflow-hidden animate-fadeIn space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-4.5 h-4.5 text-indigo-500" />
                ตั้งค่าช่องทางการรับเงิน (บัญชีธนาคาร & คิวอาร์โค้ด)
              </h3>
              <p className="text-xs text-slate-400 mt-1">ตั้งค่าชื่อธนาคาร, เลขบัญชี, ชื่อบัญชี และลิงก์รูปภาพ QR Code สำหรับหน้าชำระเงินของลูกค้า</p>
            </div>
            
            <form onSubmit={handleUpdateDepositSettings} className="max-w-xl space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  ชื่อธนาคาร
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ธนาคารกสิกรไทย (KASIKORNBANK)"
                  value={depBankName}
                  onChange={(e) => setDepBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  เลขที่บัญชี
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 112-8-94819-3"
                  value={depAccountNumber}
                  onChange={(e) => setDepAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  ชื่อบัญชีผู้รับโอน
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บริษัท มวยสโตร์ จำกัด"
                  value={depAccountName}
                  onChange={(e) => setDepAccountName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span>ลิงก์รูปภาพ QR Code (แนะนำ: 500x500 px) / อัปโหลดรูปภาพ</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="เช่น /images/my-qr.png หรือ ลิงก์รูปภาพออนไลน์ (แนะนำ: 500x500 px)"
                    value={depQrImageUrl}
                    onChange={(e) => setDepQrImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                  <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 transition-all select-none border border-slate-200 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingField === 'depositQr' ? 'อัปโหลด...' : 'อัปโหลด'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleUploadImage(e, 'depositQr')} 
                      disabled={uploadingField !== null}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-indigo-500 font-medium mt-1">แนะนำ: อัตราส่วน 1:1 ทรงจัตุรัส (เช่น 500x500 พิกเซล)</p>
                {depQrImageUrl && (
                  <div className="mt-2 p-2 border border-slate-100 rounded-xl bg-slate-50/50 w-fit">
                    <span className="text-[9px] text-slate-400 font-bold block mb-1">ตัวอย่างรูป QR Code:</span>
                    <img 
                      src={depQrImageUrl} 
                      alt="Admin QR Preview" 
                      className="w-24 h-24 object-contain bg-white border border-slate-200 rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100?text=Invalid+Image';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span>โลโก้แอปธนาคาร (แนะนำ: 100x100 px) / อัปโหลดรูปโลโก้ (ถ้ามี)</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="เช่น /images/my-bank-logo.png หรือ ลิงก์รูปภาพออนไลน์ (แนะนำ: 100x100 px)"
                    value={depBankLogoUrl}
                    onChange={(e) => setDepBankLogoUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                  <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 transition-all select-none border border-slate-200 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingField === 'depositBankLogo' ? 'อัปโหลด...' : 'อัปโหลด'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleUploadImage(e, 'depositBankLogo')} 
                      disabled={uploadingField !== null}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-indigo-500 font-medium mt-1">แนะนำ: ทรงจัตุรัสขนาดเล็ก (เช่น 100x100 พิกเซล)</p>
                {depBankLogoUrl && (
                  <div className="mt-2 p-2 border border-slate-100 rounded-xl bg-slate-50/50 w-fit">
                    <span className="text-[9px] text-slate-400 font-bold block mb-1">ตัวอย่างรูปโลโก้ธนาคาร:</span>
                    <img 
                      src={depBankLogoUrl} 
                      alt="Bank Logo Preview" 
                      className="w-12 h-12 object-contain bg-white border border-slate-200 rounded-lg animate-fadeIn"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100?text=Invalid+Image';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4.5 h-4.5 text-indigo-500" />
                  การตั้งค่าตรวจสอบสลิปอัตโนมัติ (SlipOK API)
                </h4>
                <p className="text-[11px] text-slate-400">ระบุคีย์และรหัสสาขา SlipOk เพื่อเปิดใช้งานการตรวจสลิปและเครดิตอัตโนมัติ หากไม่มีการตั้งค่าไว้ระบบจะดึงค่าจากไฟล์ตั้งค่าสภาพแวดล้อม (.env) เป็นหลัก</p>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    SlipOK API Key
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น slipok-40c8943a-8f4a-..."
                    value={depSlipOkApiKey}
                    onChange={(e) => setDepSlipOkApiKey(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    SlipOK Branch ID (รหัสสาขา)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 44043"
                    value={depSlipOkBranchId}
                    onChange={(e) => setDepSlipOkBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-premium shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึกการตั้งค่าการเติมเงิน</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 8. LINE NOTIFICATION SETTINGS TAB */}
        {activeTab === 'lineSettings' && (
          <div className="bg-white border border-slate-200/50 rounded-2xl p-5 overflow-hidden animate-fadeIn space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bell className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
                ตั้งค่าระบบแจ้งเตือน LINE Bot (Messaging API)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ตั้งค่าเพื่อเชื่อมต่อระบบแจ้งเตือนส่วนตัวส่งตรงหาไลน์คุณ เมื่อมีการเติมเงิน สต๊อกสินค้าเหลือน้อย หรือมีการสั่งซื้อเข้ามา
              </p>
            </div>
            
            <form onSubmit={(e) => handleUpdateDepositSettings(e, 'line')} className="max-w-xl space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    LINE Channel Access Token
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ป้อน Channel Access Token ของ LINE Messaging API"
                    value={depLineChannelAccessToken}
                    onChange={(e) => setDepLineChannelAccessToken(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    LINE Admin User ID (ไอดีไลน์ส่วนตัวของผู้รับแจ้งเตือน)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ป้อน User ID ของบัญชี LINE ส่วนตัวคุณ (ขึ้นต้นด้วย U...)"
                    value={depLineAdminUserId}
                    onChange={(e) => setDepLineAdminUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[10px] text-slate-600 leading-relaxed">
                  💡 <strong>คำแนะนำในการใช้งาน:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>อย่าลืมสแกนคิวอาร์โค้ดเพิ่มเพื่อนกับบอท (LINE Bot) ที่คุณสร้างไว้ก่อนทดสอบ</li>
                    <li>เมื่อบันทึกการตั้งค่าแล้ว ค่าเหล่านี้จะถูกล็อคและคงอยู่ในระบบตลอดเวลาโดยไม่ต้องกรอกซ้ำ</li>
                  </ul>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-premium shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังบันทึกและล็อกค่า...</span>
                  </>
                ) : (
                  <span>บันทึกและล็อคค่าแจ้งเตือน LINE</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 9. SITE SETTINGS TAB */}
        {activeTab === 'siteSettings' && (
          <div className="bg-white border border-slate-200/50 rounded-2xl p-5 overflow-hidden animate-fadeIn space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="w-4.5 h-4.5 text-indigo-500" />
                ตั้งค่าร้านค้า (โลโก้ & ชื่อร้าน)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ปรับแต่งโลโก้และชื่อร้านค้าของคุณ ซึ่งจะแสดงผลบนหน้าเว็บไซต์ (Header & Footer)
              </p>
            </div>
            
            <form onSubmit={handleUpdateSiteSettings} className="max-w-xl space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    ชื่อร้านค้า (Store Name)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น mymuayy"
                    value={siteStoreName}
                    onChange={(e) => setSiteStoreName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ชื่อร้านค้าจะปรากฏที่แถบเมนูด้านบนและส่วนลิขสิทธิ์ด้านล่าง</p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    โลโก้ร้านค้า (แนะนำ: 200x200 px) (Store Logo URL)
                  </label>
                  <div className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="ป้อน URL รูปภาพโลโก้ หรืออัปโหลดไฟล์ (แนะนำ: 200x200 px)"
                      value={siteLogoUrl}
                      onChange={(e) => setSiteLogoUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 flex-1"
                    />
                    <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 transition-all select-none border border-slate-200 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingField === 'siteLogo' ? 'อัปโหลด...' : 'อัปโหลดโลโก้'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleUploadImage(e, 'siteLogo')} 
                        disabled={uploadingField !== null}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-indigo-500 font-medium mt-1">แนะนำ: ขนาดจัตุรัสหรือกะทัดรัด (เช่น 200x200 พิกเซล)</p>
                  {siteLogoUrl && (
                    <div className="mt-3 p-2 border border-slate-100 rounded-xl bg-slate-50/50 w-fit">
                      <span className="text-[10px] text-slate-400 font-bold block mb-2">ตัวอย่างโลโก้ร้าน:</span>
                      <img 
                        src={siteLogoUrl} 
                        alt="Store Logo Preview" 
                        className="w-16 h-16 object-contain bg-slate-100 border border-slate-200 rounded-xl"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/100x100?text=Invalid+Logo';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-premium shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึกการตั้งค่าร้านค้า</span>
                )}
              </button>
            </form>
          </div>
        )}


        {/* EMAIL SETTINGS TAB */}
        {activeTab === 'emailSettings' && (
          <div className="animate-fadeIn">
            <div className="bg-white border border-slate-200/50 rounded-2xl p-5">
              <EmailSettingsPanel />
            </div>
          </div>
        )}

      </div>

      {/* Lightbox Modal */}
      {lightboxImageUrl && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 border border-slate-700/10 overflow-hidden shadow-2xl flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setLightboxImageUrl(null)}
              className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm font-bold border-none"
              title="ปิด"
            >
              ✕
            </button>
            <div className="overflow-y-auto max-h-[85vh] p-1 flex justify-center items-center">
              <img 
                src={lightboxImageUrl} 
                alt="วิธีการเข้าใช้งาน" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg" 
              />
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

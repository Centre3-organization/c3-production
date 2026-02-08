import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Languages, 
  Search, 
  Edit2, 
  Save, 
  X, 
  Plus,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { supportedLanguages } from "@/lib/i18n";

// Type for translation entries
interface TranslationEntry {
  key: string;
  category: string;
  en: string;
  ar: string;
  isModified?: boolean;
}

// Flatten nested translation object to array of entries
function flattenTranslations(obj: any, prefix = '', category = ''): TranslationEntry[] {
  const entries: TranslationEntry[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // This is a category/namespace
      const newCategory = category || key;
      entries.push(...flattenTranslations(value, fullKey, newCategory));
    } else {
      entries.push({
        key: fullKey,
        category: category || 'general',
        en: typeof value === 'string' ? value : JSON.stringify(value),
        ar: '', // Will be filled from AR translations
      });
    }
  }
  
  return entries;
}

// Categories for organizing translations
const categories = [
  { id: 'all', label: 'All', labelAr: 'الكل' },
  { id: 'common', label: 'Common', labelAr: 'عام' },
  { id: 'auth', label: 'Authentication', labelAr: 'المصادقة' },
  { id: 'nav', label: 'Navigation', labelAr: 'التنقل' },
  { id: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم' },
  { id: 'requests', label: 'Requests', labelAr: 'الطلبات' },
  { id: 'approvals', label: 'Approvals', labelAr: 'الموافقات' },
  { id: 'sites', label: 'Sites & Facilities', labelAr: 'المواقع والمرافق' },
  { id: 'users', label: 'Users', labelAr: 'المستخدمين' },
  { id: 'settings', label: 'Settings', labelAr: 'الإعدادات' },
  { id: 'validation', label: 'Validation', labelAr: 'التحقق' },
  { id: 'actions', label: 'Actions', labelAr: 'الإجراءات' },
];

export default function TranslationManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [filteredTranslations, setFilteredTranslations] = useState<TranslationEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ en: string; ar: string }>({ en: '', ar: '' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ key: '', category: 'common', en: '', ar: '' });
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load translations from JSON files
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        // Fetch both language files
        const [enResponse, arResponse] = await Promise.all([
          fetch('/locales/en/translation.json'),
          fetch('/locales/ar/translation.json')
        ]);
        
        const enData = await enResponse.json();
        const arData = await arResponse.json();
        
        // Flatten English translations
        const enEntries = flattenTranslations(enData);
        
        // Merge Arabic translations
        const mergedEntries = enEntries.map(entry => {
          // Navigate to the Arabic value using the key path
          const keyParts = entry.key.split('.');
          let arValue = arData;
          for (const part of keyParts) {
            arValue = arValue?.[part];
          }
          return {
            ...entry,
            ar: typeof arValue === 'string' ? arValue : entry.en,
          };
        });
        
        setTranslations(mergedEntries);
        setFilteredTranslations(mergedEntries);
      } catch (error) {
        console.error('Failed to load translations:', error);
        toast.error('Failed to load translations');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTranslations();
  }, []);

  // Filter translations based on search and category
  useEffect(() => {
    let filtered = translations;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.key.toLowerCase().includes(query) ||
        t.en.toLowerCase().includes(query) ||
        t.ar.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'done') {
        filtered = filtered.filter(t => t.ar && t.ar !== t.en && !t.isModified);
      } else if (selectedStatus === 'missing') {
        filtered = filtered.filter(t => !t.ar || t.ar === t.en);
      } else if (selectedStatus === 'modified') {
        filtered = filtered.filter(t => t.isModified);
      }
    }
    
    setFilteredTranslations(filtered);
  }, [translations, searchQuery, selectedCategory, selectedStatus]);

  // Start editing a translation
  const startEditing = (entry: TranslationEntry) => {
    setEditingKey(entry.key);
    setEditValues({ en: entry.en, ar: entry.ar });
  };

  // Save edited translation
  const saveEdit = () => {
    if (!editingKey) return;
    
    setTranslations(prev => prev.map(t => 
      t.key === editingKey 
        ? { ...t, en: editValues.en, ar: editValues.ar, isModified: true }
        : t
    ));
    setEditingKey(null);
    setHasChanges(true);
    toast.success('Translation updated');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingKey(null);
    setEditValues({ en: '', ar: '' });
  };

  // Add new translation entry
  const addNewEntry = () => {
    if (!newEntry.key || !newEntry.en) {
      toast.error('Key and English value are required');
      return;
    }
    
    if (translations.some(t => t.key === newEntry.key)) {
      toast.error('Translation key already exists');
      return;
    }
    
    setTranslations(prev => [...prev, { ...newEntry, isModified: true }]);
    setNewEntry({ key: '', category: 'common', en: '', ar: '' });
    setIsAddDialogOpen(false);
    setHasChanges(true);
    toast.success('Translation added');
  };

  // Export translations to JSON
  const exportTranslations = (lang: 'en' | 'ar') => {
    const data: any = {};
    
    translations.forEach(entry => {
      const keyParts = entry.key.split('.');
      let current = data;
      
      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!current[keyParts[i]]) {
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }
      
      current[keyParts[keyParts.length - 1]] = lang === 'en' ? entry.en : entry.ar;
    });
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${lang}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${lang.toUpperCase()} translations exported`);
  };

  // Save all changes (would need backend API in production)
  const saveAllChanges = () => {
    // In production, this would call an API to save the translations
    // For now, we'll just show a success message and export the files
    toast.success('Changes saved! Export the files to apply them permanently.');
    setHasChanges(false);
    
    // Mark all as not modified
    setTranslations(prev => prev.map(t => ({ ...t, isModified: false })));
  };

  // Get statistics
  const stats = {
    total: translations.length,
    translated: translations.filter(t => t.ar && t.ar !== t.en).length,
    missing: translations.filter(t => !t.ar || t.ar === t.en).length,
    modified: translations.filter(t => t.isModified).length,
  };

  // Calculate completion percentage
  const completionPercentage = stats.total > 0 ? Math.round((stats.translated / stats.total) * 100) : 0;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8 flex items-center gap-2">
            <Languages className="h-6 w-6 text-[#5B2C93]" />
            {isRTL ? 'إدارة الترجمات' : 'Translation Management'}
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isRTL ? 'إدارة وتحرير جميع سلاسل الترجمة للتطبيق' : 'Manage and edit all translation strings for the application'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button onClick={saveAllChanges} className="gap-2">
              <Save className="h-4 w-4" />
              {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isRTL ? 'إضافة ترجمة' : 'Add Translation'}
          </Button>
        </div>
      </div>

      {/* Translation Completeness Progress Bar */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#5B2C93]" />
              {isRTL ? 'اكتمال الترجمة' : 'Translation Completeness'}
            </CardTitle>
            <Badge variant={completionPercentage === 100 ? 'default' : completionPercentage >= 80 ? 'secondary' : 'destructive'}>
              {completionPercentage}%
            </Badge>
          </div>
          <CardDescription>
            {isRTL 
              ? `${stats.translated} من ${stats.total} سلسلة مترجمة إلى العربية`
              : `${stats.translated} of ${stats.total} strings translated to Arabic`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 w-full bg-[#F5F5F5] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  completionPercentage === 100 
                    ? 'bg-[#D1FAE5]' 
                    : completionPercentage >= 80 
                      ? 'bg-[#E8DCF5]' 
                      : completionPercentage >= 50 
                        ? 'bg-[#FEF3C7]' 
                        : 'bg-[#FF6B6B]'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#6B6B6B]">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-[#059669]" />
                {isRTL ? 'مترجم' : 'Translated'}: {stats.translated}
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-[#D97706]" />
                {isRTL ? 'مفقود' : 'Missing'}: {stats.missing}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              {isRTL ? 'إجمالي السلاسل' : 'Total Strings'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              {isRTL ? 'مترجم' : 'Translated'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium text-[#059669]">{stats.translated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              {isRTL ? 'مفقود' : 'Missing'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium text-[#D97706]">{stats.missing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              {isRTL ? 'معدل' : 'Modified'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium text-[#5B2C93]">{stats.modified}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]`} />
              <Input
                placeholder={isRTL ? 'البحث في الترجمات...' : 'Search translations...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? 'pr-9' : 'pl-9'}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isRTL ? 'اختر الفئة' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {isRTL ? cat.labelAr : cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={isRTL ? 'الحالة' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                <SelectItem value="done">{isRTL ? 'مترجم' : 'Done'}</SelectItem>
                <SelectItem value="missing">{isRTL ? 'مفقود' : 'Missing'}</SelectItem>
                <SelectItem value="modified">{isRTL ? 'معدل' : 'Modified'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-[#6B6B6B]" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">{isRTL ? 'المفتاح' : 'Key'}</TableHead>
                    <TableHead className="w-[100px]">{isRTL ? 'الفئة' : 'Category'}</TableHead>
                    <TableHead>{isRTL ? 'الإنجليزية' : 'English'}</TableHead>
                    <TableHead>{isRTL ? 'العربية' : 'Arabic'}</TableHead>
                    <TableHead className="w-[100px]">{isRTL ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="w-[100px]">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranslations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-[#6B6B6B]">
                        {isRTL ? 'لا توجد ترجمات مطابقة' : 'No matching translations found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTranslations.slice(0, 50).map((entry) => (
                      <TableRow key={entry.key}>
                        <TableCell className="font-mono text-xs">{entry.key}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {entry.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {editingKey === entry.key ? (
                            <Textarea
                              value={editValues.en}
                              onChange={(e) => setEditValues(prev => ({ ...prev, en: e.target.value }))}
                              className="min-h-[60px]"
                              dir="ltr"
                            />
                          ) : (
                            <span className="text-sm">{entry.en}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingKey === entry.key ? (
                            <Textarea
                              value={editValues.ar}
                              onChange={(e) => setEditValues(prev => ({ ...prev, ar: e.target.value }))}
                              className="min-h-[60px]"
                              dir="rtl"
                            />
                          ) : (
                            <span className="text-sm" dir="rtl">{entry.ar}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.isModified ? (
                            <Badge className="bg-[#E8DCF5] text-[#5B2C93]">
                              {isRTL ? 'معدل' : 'Modified'}
                            </Badge>
                          ) : entry.ar && entry.ar !== entry.en ? (
                            <Badge className="bg-[#D1FAE5] text-[#059669]">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {isRTL ? 'مترجم' : 'Done'}
                            </Badge>
                          ) : (
                            <Badge className="bg-[#FEF3C7] text-[#D97706]">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {isRTL ? 'مفقود' : 'Missing'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingKey === entry.key ? (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={saveEdit}>
                                <Save className="h-4 w-4 text-[#059669]" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                <X className="h-4 w-4 text-[#FF6B6B]" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="icon" variant="ghost" onClick={() => startEditing(entry)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {filteredTranslations.length > 50 && (
                <div className="p-4 text-center text-sm text-[#6B6B6B] border-t">
                  {isRTL 
                    ? `عرض 50 من ${filteredTranslations.length} ترجمة. استخدم البحث لتضييق النتائج.`
                    : `Showing 50 of ${filteredTranslations.length} translations. Use search to narrow results.`
                  }
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Translation Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة ترجمة جديدة' : 'Add New Translation'}</DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'أضف سلسلة ترجمة جديدة للتطبيق'
                : 'Add a new translation string to the application'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{isRTL ? 'المفتاح' : 'Key'}</Label>
              <Input
                placeholder="e.g., common.newFeature"
                value={newEntry.key}
                onChange={(e) => setNewEntry(prev => ({ ...prev, key: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>{isRTL ? 'الفئة' : 'Category'}</Label>
              <Select 
                value={newEntry.category} 
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.id !== 'all').map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {isRTL ? cat.labelAr : cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{isRTL ? 'الإنجليزية' : 'English'}</Label>
              <Textarea
                placeholder="English text"
                value={newEntry.en}
                onChange={(e) => setNewEntry(prev => ({ ...prev, en: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div className="grid gap-2">
              <Label>{isRTL ? 'العربية' : 'Arabic'}</Label>
              <Textarea
                placeholder="النص العربي"
                value={newEntry.ar}
                onChange={(e) => setNewEntry(prev => ({ ...prev, ar: e.target.value }))}
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={addNewEntry}>
              {isRTL ? 'إضافة' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

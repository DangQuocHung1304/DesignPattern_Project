import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../src/services/api';

interface HealthNews {
  id: number;
  title: string;
  summary: string;
  image: string;
  category: string;
  categoryName: string;
  author: string;
  publishedDate: string;
  views: number;
  tags: string[];
  isFeatured: boolean;
}

const categories = [
  { label: 'Tất cả', value: '' },
  { label: 'Sức khỏe tổng quát', value: 'Sức khỏe tổng quát' },
  { label: 'Dinh dưỡng', value: 'Dinh dưỡng' },
  { label: 'Bệnh học', value: 'Bệnh học' },
  { label: 'Phòng ngừa', value: 'Phòng ngừa' },
  { label: 'Sống khỏe', value: 'Sống khỏe' },
];

export default function NewsScreen() {
  const [news, setNews] = useState<HealthNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNews = React.useCallback(async (pageNumber = 1, append = false) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: any = {
        page: pageNumber,
        limit: 10, // Changed from pageSize to limit
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const response = await api.get('/news', { params });
      console.log('News API response:', response.data);
      
      // Backend returns: {success: true, data: {news: [...], pagination: {...}}}
      const newsData = response.data.data.news || [];
      const pagination = response.data.data.pagination || {};
      
      if (append) {
        setNews(prev => [...prev, ...newsData]);
      } else {
        setNews(newsData);
      }
      
      setPage(pagination.page || 1);
      setTotalPages(pagination.totalPages || 1);
    } catch (error: any) {
      console.error('Error loading news:', error);
      Alert.alert('Lỗi', 'Không thể tải tin tức');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && page < totalPages) {
      loadNews(page + 1, true);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Sức khỏe tổng quát': '#0066cc',
      'Dinh dưỡng': '#00a86b',
      'Bệnh học': '#ff6b35',
      'Phòng ngừa': '#9b59b6',
      'Sống khỏe': '#f39c12',
    };
    return colors[category] || '#95a5a6';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const renderNewsItem = ({ item }: { item: HealthNews }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => router.push(`/news-detail/${item.id}` as any)}
      activeOpacity={0.7}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.newsImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.newsImage, styles.placeholderImage]}>
          <FontAwesome name="newspaper-o" size={40} color="#bdc3c7" />
        </View>
      )}
      
      <View style={styles.newsContent}>
        <View style={styles.newsHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.categoryName}</Text>
          </View>
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <FontAwesome name="star" size={12} color="#f39c12" />
              <Text style={styles.featuredText}>Nổi bật</Text>
            </View>
          )}
        </View>

        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={styles.newsSummary} numberOfLines={3}>
          {item.summary}
        </Text>

        <View style={styles.newsFooter}>
          <View style={styles.authorInfo}>
            <FontAwesome name="user" size={12} color="#7f8c8d" />
            <Text style={styles.authorText}>{item.author}</Text>
          </View>
          <View style={styles.viewInfo}>
            <FontAwesome name="eye" size={12} color="#7f8c8d" />
            <Text style={styles.viewText}>{item.views}</Text>
          </View>
        </View>

        <Text style={styles.dateText}>{formatDate(item.publishedDate)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải tin tức...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin tức Y tế</Text>
        <Text style={styles.headerSubtitle}>Cập nhật kiến thức sức khỏe</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryScrollWrapper}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.value && styles.categoryChipActive
              ]}
              onPress={() => handleCategoryChange(item.value)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.value && styles.categoryChipTextActive
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* News List */}
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item, index) => item?.id?.toString() || `news-${index}`}
        contentContainerStyle={styles.newsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0066cc']}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="newspaper-o" size={60} color="#bdc3c7" />
            <Text style={styles.emptyText}>Chưa có tin tức nào</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0066cc',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  categoryScrollWrapper: {
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  categoryContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#0066cc',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  newsList: {
    padding: 15,
  },
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsImage: {
    width: '100%',
    height: 180,
  },
  placeholderImage: {
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsContent: {
    padding: 15,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '600',
    marginLeft: 4,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 24,
  },
  newsSummary: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  viewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#95a5a6',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#95a5a6',
  },
});

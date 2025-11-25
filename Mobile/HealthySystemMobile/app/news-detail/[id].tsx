import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../src/services/api';

interface HealthNews {
  id: number;
  title: string;
  summary: string;
  content: string;
  image: string;
  category: string;
  categoryName: string;
  author: string;
  publishedDate: string;
  views: number;
  tags: string[];
  relatedNews: any[];
}

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams();
  const [news, setNews] = useState<HealthNews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadNewsDetail();
    }
  }, [id]);

  const loadNewsDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/news/${id}`);
      // Backend returns {success: true, data: {...}}
      setNews(response.data.data);
    } catch (error: any) {
      console.error('Error loading news detail:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết tin tức', [
        {
          text: 'Quay lại',
          onPress: () => router.back(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!news) return;

    try {
      await Share.share({
        message: `${news.title}\n\n${news.summary}`,
        title: news.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!news) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="exclamation-triangle" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>Không tìm thấy tin tức</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết tin tức</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleShare}
        >
          <FontAwesome name="share-alt" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {news.image ? (
          <Image
            source={{ uri: news.image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <FontAwesome name="newspaper-o" size={60} color="#bdc3c7" />
          </View>
        )}

        <View style={styles.articleContent}>
          {/* Category Badge */}
          <View style={styles.badges}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(news.category) }]}>
              <Text style={styles.categoryText}>{news.categoryName}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{news.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <FontAwesome name="user" size={14} color="#7f8c8d" />
              <Text style={styles.metaText}>{news.author}</Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name="clock-o" size={14} color="#7f8c8d" />
              <Text style={styles.metaText}>{formatDate(news.publishedDate)}</Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome name="eye" size={14} color="#7f8c8d" />
              <Text style={styles.metaText}>{news.views} lượt xem</Text>
            </View>
          </View>

          {/* Summary */}
          {news.summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summary}>{news.summary}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content */}
          <Text style={styles.content}>{news.content}</Text>

          {/* Share Section */}
          <View style={styles.shareSection}>
            <Text style={styles.shareText}>Chia sẻ bài viết này:</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <FontAwesome name="share-alt" size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Chia sẻ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0066cc',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
  },
  placeholderImage: {
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleContent: {
    padding: 20,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
    marginLeft: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    lineHeight: 32,
    marginBottom: 15,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  metaText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  summaryContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
    borderRadius: 4,
    marginBottom: 20,
  },
  summary: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 20,
  },
  contentText: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 26,
    textAlign: 'justify',
  },
  shareSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    alignItems: 'center',
  },
  shareText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  shareButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#7f8c8d',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#e74c3c',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#0066cc',
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

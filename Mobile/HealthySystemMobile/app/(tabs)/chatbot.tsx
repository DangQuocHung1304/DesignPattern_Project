import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import api from '../../src/services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface QuickReply {
  id: string;
  text: string;
  query: string;
}

const QUICK_REPLIES: QuickReply[] = [
  { id: '1', text: '🤒 Triệu chứng sốt', query: 'Tôi bị sốt, nên làm gì?' },
  { id: '2', text: '💊 Hướng dẫn dùng thuốc', query: 'Hướng dẫn cách dùng thuốc an toàn' },
  { id: '3', text: '🥗 Tư vấn dinh dưỡng', query: 'Chế độ ăn uống lành mạnh' },
  { id: '4', text: '🏃 Vận động thể chất', query: 'Bài tập thể dục phù hợp' },
  { id: '5', text: '😴 Giấc ngủ', query: 'Cách cải thiện giấc ngủ' },
  { id: '6', text: '🧘 Sức khỏe tinh thần', query: 'Cách giảm stress và lo âu' },
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Xin chào! Tôi là trợ lý ảo của phòng khám. Tôi có thể giúp bạn tư vấn về sức khỏe, triệu chứng bệnh, dinh dưỡng và nhiều vấn đề khác. Bạn cần hỗ trợ gì?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setShowQuickReplies(false);

    try {
      // Call chatbot API
      const response = await api.post('/chatbot/message', {
        message: text.trim(),
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.data.reply || 'Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể diễn đạt lại được không?',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Fallback responses for common queries
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getFallbackResponse(text.trim()),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('sốt') || lowerQuery.includes('nóng')) {
      return '🤒 Về triệu chứng sốt:\n\n' +
        '• Nghỉ ngơi đầy đủ\n' +
        '• Uống nhiều nước\n' +
        '• Dùng thuốc hạ sốt theo chỉ định\n' +
        '• Theo dõi nhiệt độ\n\n' +
        'Nếu sốt trên 39°C hoặc kéo dài trên 3 ngày, vui lòng đến khám bác sĩ.';
    }

    if (lowerQuery.includes('đau đầu') || lowerQuery.includes('nhức đầu')) {
      return '🤕 Về triệu chứng đau đầu:\n\n' +
        '• Nghỉ ngơi trong phòng tối, yên tĩnh\n' +
        '• Chườm lạnh vùng trán\n' +
        '• Massage nhẹ nhàng\n' +
        '• Tránh căng thẳng\n\n' +
        'Nếu đau đầu dữ dội hoặc kèm buồn nôn, hãy gặp bác sĩ ngay.';
    }

    if (lowerQuery.includes('ăn uống') || lowerQuery.includes('dinh dưỡng')) {
      return '🥗 Tư vấn dinh dưỡng:\n\n' +
        '• Ăn đủ 3 bữa chính\n' +
        '• Tăng rau xanh, trái cây\n' +
        '• Uống 2-2.5 lít nước/ngày\n' +
        '• Hạn chế đồ chiên rán, nhiều dầu mỡ\n' +
        '• Bổ sung protein từ thịt, cá, trứng, đậu';
    }

    if (lowerQuery.includes('tập') || lowerQuery.includes('vận động')) {
      return '🏃 Về vận động thể chất:\n\n' +
        '• Tập ít nhất 30 phút/ngày\n' +
        '• Chọn bài tập phù hợp sức khỏe\n' +
        '• Khởi động kỹ trước khi tập\n' +
        '• Nghỉ ngơi hợp lý\n' +
        '• Uống nước đầy đủ';
    }

    if (lowerQuery.includes('ngủ') || lowerQuery.includes('mất ngủ')) {
      return '😴 Về giấc ngủ:\n\n' +
        '• Ngủ đủ 7-8 tiếng/đêm\n' +
        '• Đi ngủ và thức dậy đúng giờ\n' +
        '• Tránh sử dụng điện thoại trước khi ngủ\n' +
        '• Không uống caffeine buổi tối\n' +
        '• Tạo môi trường phòng ngủ thoải mái';
    }

    if (lowerQuery.includes('stress') || lowerQuery.includes('lo âu')) {
      return '🧘 Về sức khỏe tinh thần:\n\n' +
        '• Thực hành hít thở sâu\n' +
        '• Thiền định 10-15 phút/ngày\n' +
        '• Tập yoga hoặc thái cực quyền\n' +
        '• Dành thời gian cho sở thích\n' +
        '• Chia sẻ với người thân';
    }

    return '🤖 Tôi có thể giúp bạn với:\n\n' +
      '• Tư vấn về triệu chứng bệnh\n' +
      '• Hướng dẫn chăm sóc sức khỏe\n' +
      '• Dinh dưỡng và chế độ ăn\n' +
      '• Vận động thể chất\n' +
      '• Sức khỏe tinh thần\n\n' +
      'Vui lòng đặt câu hỏi cụ thể để tôi có thể tư vấn tốt hơn!';
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.query);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <FontAwesome name="stethoscope" size={16} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userMessage : styles.botMessage,
        ]}
      >
        <Text style={[styles.messageText, item.isUser && styles.userMessageText]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, item.isUser && styles.userTimeText]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
      {item.isUser && (
        <View style={styles.userAvatar}>
          <FontAwesome name="user" size={16} color="#fff" />
        </View>
      )}
    </View>
  );

  const renderQuickReplies = () => {
    if (!showQuickReplies || messages.length > 1) return null;

    return (
      <View style={styles.quickRepliesContainer}>
        <Text style={styles.quickRepliesTitle}>Gợi ý câu hỏi:</Text>
        <View style={styles.quickRepliesGrid}>
          {QUICK_REPLIES.map((reply) => (
            <TouchableOpacity
              key={reply.id}
              style={styles.quickReplyButton}
              onPress={() => handleQuickReply(reply)}
            >
              <Text style={styles.quickReplyText}>{reply.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <FontAwesome name="stethoscope" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Trợ lý sức khỏe</Text>
            <Text style={styles.headerSubtitle}>Luôn sẵn sàng hỗ trợ bạn</Text>
          </View>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0066cc" />
                <Text style={styles.loadingText}>Đang trả lời...</Text>
              </View>
            )}
            {renderQuickReplies()}
          </>
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập câu hỏi của bạn..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <FontAwesome name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <FontAwesome name="info-circle" size={12} color="#95a5a6" />
        <Text style={styles.disclaimerText}>
          Thông tin chỉ mang tính tham khảo. Vui lòng gặp bác sĩ để được tư vấn chuyên sâu.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  botMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessage: {
    backgroundColor: '#0066cc',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2c3e50',
  },
  userMessageText: {
    color: '#fff',
  },
  timeText: {
    fontSize: 10,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'right',
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  quickRepliesContainer: {
    marginTop: 10,
    padding: 15,
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  quickRepliesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickReplyButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickReplyText: {
    fontSize: 13,
    color: '#2c3e50',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#2c3e50',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#856404',
    lineHeight: 16,
  },
});

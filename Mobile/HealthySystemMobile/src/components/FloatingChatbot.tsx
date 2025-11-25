import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  PanResponder,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

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
];

export default function FloatingChatbot() {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Xin chào! Tôi là trợ lý AI của phòng khám. Tôi có thể tư vấn về sức khỏe, triệu chứng bệnh, dinh dưỡng. Bạn cần hỗ trợ gì?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);
  
  // Draggable position
  const pan = useRef(new Animated.ValueXY({ x: width - 80, y: height - 170 })).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        setIsDragging(false);
        
        // If it was just a tap (no drag), open the chat
        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
          setIsVisible(true);
        }
        
        // Keep button within screen bounds
        let finalX = (pan.x as any)._value;
        let finalY = (pan.y as any)._value;
        
        if (finalX < 10) finalX = 10;
        if (finalX > width - 70) finalX = width - 70;
        if (finalY < 60) finalY = 60;
        if (finalY > height - 130) finalY = height - 130;
        
        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (messages.length > 0 && isVisible) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isVisible]);

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
      // Call backend API with AI integration
      const response = await api.post('/chatbot/message', {
        message: text.trim(),
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.data.reply || 'Xin lỗi, tôi không thể trả lời lúc này.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      
      // Fallback to offline responses
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getFallbackResponse(text.trim()),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }
  };

  const getFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('sốt') || lowerQuery.includes('nóng')) {
      return '🤒 **Triệu chứng sốt:**\n\n• Nghỉ ngơi đầy đủ\n• Uống nhiều nước\n• Dùng thuốc hạ sốt theo chỉ định\n• Theo dõi nhiệt độ\n\nNếu sốt trên 39°C hoặc kéo dài trên 3 ngày, vui lòng đến khám bác sĩ.';
    }

    if (lowerQuery.includes('đau đầu') || lowerQuery.includes('nhức đầu')) {
      return '🤕 **Triệu chứng đau đầu:**\n\n• Nghỉ ngơi trong phòng tối\n• Chườm lạnh vùng trán\n• Massage nhẹ nhàng\n• Tránh căng thẳng\n\nNếu đau đầu dữ dội hoặc kèm buồn nôn, hãy gặp bác sĩ.';
    }

    if (lowerQuery.includes('ăn uống') || lowerQuery.includes('dinh dưỡng')) {
      return '🥗 **Tư vấn dinh dưỡng:**\n\n• Ăn đủ 3 bữa chính\n• Tăng rau xanh, trái cây\n• Uống 2-2.5 lít nước/ngày\n• Hạn chế đồ chiên rán\n• Bổ sung protein đầy đủ';
    }

    if (lowerQuery.includes('tập') || lowerQuery.includes('vận động')) {
      return '🏃 **Vận động thể chất:**\n\n• Tập ít nhất 30 phút/ngày\n• Chọn bài tập phù hợp\n• Khởi động kỹ trước khi tập\n• Nghỉ ngơi hợp lý\n• Uống nước đầy đủ';
    }

    return '🤖 **Tôi có thể giúp bạn:**\n\n• Tư vấn triệu chứng bệnh\n• Hướng dẫn chăm sóc sức khỏe\n• Dinh dưỡng và chế độ ăn\n• Vận động thể chất\n\nVui lòng đặt câu hỏi cụ thể!';
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
          <Text style={styles.avatarText}>AI</Text>
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
    <>
      {/* Floating Button */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.floatingButton,
          {
            transform: pan.getTranslateTransform(),
          },
        ]}
      >
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.buttonText}>AI</Text>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
          </View>
        </Animated.View>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatBubble}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.headerAvatar}>
                  <Text style={styles.headerAvatarText}>AI</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>Trợ lý AI</Text>
                  <Text style={styles.headerSubtitle}>Luôn sẵn sàng hỗ trợ</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <FontAwesome name="times" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
              style={styles.chatContent}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
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

              {/* Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập câu hỏi..."
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                  ]}
                  onPress={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading}
                >
                  <FontAwesome name="send" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Disclaimer */}
              <View style={styles.disclaimer}>
                <FontAwesome name="info-circle" size={10} color="#856404" />
                <Text style={styles.disclaimerText}>
                  Chỉ mang tính tham khảo. Vui lòng gặp bác sĩ để được tư vấn chuyên sâu.
                </Text>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    zIndex: 9999,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27ae60',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  chatBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 15,
  },
  botMessage: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    backgroundColor: '#0066cc',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2c3e50',
  },
  userMessageText: {
    color: '#fff',
  },
  timeText: {
    fontSize: 9,
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
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  quickRepliesContainer: {
    marginTop: 8,
    paddingVertical: 10,
  },
  quickRepliesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  quickRepliesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickReplyText: {
    fontSize: 12,
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
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
    color: '#2c3e50',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: '#856404',
    lineHeight: 14,
  },
});

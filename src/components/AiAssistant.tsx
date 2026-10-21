import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, X, CheckCircle2, Lightbulb, Zap, Sun, Shield, Music, Minimize2, Maximize2, Trash2, Palette } from 'lucide-react';
import type { Lighting } from '../hooks/useLighting';
import type { RgbLedHook } from '../hooks/useRgbLed';
import { useHistoricalMusic } from '../contexts/MusicContext';
import { HISTORICAL_SONGS } from '../data/historicalMusic';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actionTaken?: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Bật toàn bộ hệ thống đèn',
  'Bật hiệu ứng cầu vồng LED RGB',
  'Bật LED RGB nháy theo âm thanh',
  'Bật hiệu ứng ngọn lửa',
  'Bật đèn Đồi Khau Tý & Lán Tỉn Keo',
  'Bật đèn Nhà tưởng niệm',
  'Bật tự động theo cảm biến ánh sáng',
  'Tư vấn chiếu sáng đón đoàn khách tối nay',
  'Bật bài hát lịch sử về Bác Hồ',
];

export function AiAssistant({ state, rgb, onNavigate }: { state: Lighting; rgb?: RgbLedHook; onNavigate?: (page: string) => void }) {
  const { playSong } = useHistoricalMusic();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI Chiếu sáng ATK Định Hóa. Tôi có thể tư vấn kịch bản chiếu sáng và trực tiếp ra lệnh điều khiển độc lập cho cả 2 thiết bị: Trạm 1 ESP8266 (4 Kênh Relay D5–D8 & Cảm biến quang) và Trạm 2 ESP32 (LED Nghệ thuật WS2812B 12 hiệu ứng & Cảm biến âm thanh). Bạn cần tôi hỗ trợ gì?',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Bộ xử lý ngôn ngữ tự nhiên tiếng Việt & Ra lệnh trực tiếp cho Relay
  const processCommand = (userInput: string) => {
    const text = userInput.toLowerCase().trim();
    let reply = '';
    let actionTaken = '';

    // 1. BẬT TOÀN BỘ HỆ THỐNG
    if (
      (text.includes('bật') || text.includes('mở') || text.includes('thắp sáng')) &&
      (text.includes('hết') || text.includes('tất cả') || text.includes('toàn bộ') || text.includes('hệ thống') || text.includes('4 khu'))
    ) {
      if (!state.on) state.toggleSystem();
      actionTaken = 'Đã BẬT toàn bộ 4 kênh Relay (D5, D6, D7, D8)';
      reply = 'Đã kích hoạt BẬT toàn bộ hệ thống chiếu sáng tại 4 khu di tích: Đồi Khau Tý, Lán Tỉn Keo, Nhà tưởng niệm và Quảng trường. Toàn bộ 168 ngọn đèn đã sẵn sàng!';
    }
    // 2. TẮT TOÀN BỘ HỆ THỐNG
    else if (
      (text.includes('tắt') || text.includes('ngắt') || text.includes('đóng')) &&
      (text.includes('hết') || text.includes('tất cả') || text.includes('toàn bộ') || text.includes('hệ thống') || text.includes('nghỉ'))
    ) {
      if (state.on) state.toggleSystem();
      actionTaken = 'Đã TẮT toàn bộ 4 kênh Relay (D5, D6, D7, D8)';
      reply = 'Đã tắt toàn bộ hệ thống chiếu sáng để đảm bảo an toàn và tiết kiệm điện năng cho khu di tích.';
    }
    // 3. ĐIỀU KHIỂN RIÊNG TỪNG KHU VỰC
    else if (text.includes('khau tý') || text.includes('khau ty') || text.includes('khu 1') || text.includes('d5')) {
      const isTurnOn = text.includes('bật') || text.includes('mở') || text.includes('thắp');
      const area = state.areas.find(a => a.id === 'khau-ty');
      if (area && area.on !== isTurnOn) state.toggleArea('khau-ty');
      actionTaken = isTurnOn ? 'Đã BẬT Relay 1 - Đồi Khau Tý (D5)' : 'Đã TẮT Relay 1 - Đồi Khau Tý (D5)';
      reply = isTurnOn
        ? 'Đã thắp sáng khu di tích Đồi Khau Tý (38 đèn). Nơi đây Bác Hồ từng ở và làm việc, sáng tác bài thơ "Cảnh khuya" bất hủ.'
        : 'Đã tắt đèn tại Đồi Khau Tý.';
    }
    else if (text.includes('tỉn keo') || text.includes('tin keo') || text.includes('khu 2') || text.includes('d6')) {
      const isTurnOn = text.includes('bật') || text.includes('mở') || text.includes('thắp');
      const area = state.areas.find(a => a.id === 'tin-keo');
      if (area && area.on !== isTurnOn) state.toggleArea('tin-keo');
      actionTaken = isTurnOn ? 'Đã BẬT Relay 2 - Lán Tỉn Keo (D6)' : 'Đã TẮT Relay 2 - Lán Tỉn Keo (D6)';
      reply = isTurnOn
        ? 'Đã thắp sáng khu Lán Tỉn Keo (32 đèn). Đây là nơi Bác Hồ chủ trì Hội nghị Bộ Chính trị quyết định mở Chiến dịch Điện Biên Phủ 1954 vang dội.'
        : 'Đã tắt đèn tại Lán Tỉn Keo.';
    }
    else if (text.includes('tưởng niệm') || text.includes('tuong niem') || text.includes('nhà bác') || text.includes('đèo de') || text.includes('khu 3') || text.includes('d7')) {
      const isTurnOn = text.includes('bật') || text.includes('mở') || text.includes('thắp');
      const area = state.areas.find(a => a.id === 'memorial');
      if (area && area.on !== isTurnOn) state.toggleArea('memorial');
      actionTaken = isTurnOn ? 'Đã BẬT Relay 3 - Nhà tưởng niệm (D7)' : 'Đã TẮT Relay 3 - Nhà tưởng niệm (D7)';
      reply = isTurnOn
        ? 'Đã thắp sáng Nhà tưởng niệm Chủ tịch Hồ Chí Minh (56 đèn). Không gian trang nghiêm và linh thiêng đã sẵn sàng cho du khách dâng hương.'
        : 'Đã tắt đèn tại Nhà tưởng niệm.';
    }
    else if (text.includes('quảng trường') || text.includes('quang truong') || text.includes('khu 4') || text.includes('d8')) {
      const isTurnOn = text.includes('bật') || text.includes('mở') || text.includes('thắp');
      const area = state.areas.find(a => a.id === 'square');
      if (area && area.on !== isTurnOn) state.toggleArea('square');
      actionTaken = isTurnOn ? 'Đã BẬT Relay 4 - Quảng trường ATK (D8)' : 'Đã TẮT Relay 4 - Quảng trường ATK (D8)';
      reply = isTurnOn
        ? 'Đã bật hệ thống chiếu sáng Quảng trường ATK (42 đèn). Khu vực sân trung tâm phục vụ đón tiếp khách tham quan.'
        : 'Đã tắt đèn Quảng trường.';
    }
    // 4. CẢM BIẾN ÁNH SÁNG & TỰ ĐỘNG
    else if (text.includes('cảm biến') || text.includes('tự động') || text.includes('ánh sáng') || text.includes('lux') || text.includes('trời tối')) {
      if (text.includes('tắt')) {
        state.setAutoLight(false);
        actionTaken = 'Đã TẮT chế độ tự động cảm biến ánh sáng';
        reply = 'Đã chuyển hệ thống sang chế độ điều khiển thủ công. Cảm biến quang sẽ không tự bật/tắt relay.';
      } else {
        state.setAutoLight(true);
        const currentLux = state.lightSensor?.lux ?? 180;
        const threshold = state.lightSensor?.threshold ?? 150;
        actionTaken = 'Đã BẬT chế độ tự động theo cảm biến quang (LDR)';
        reply = `Đã kích hoạt chế độ tự động theo ánh sáng môi trường! Hiện tại quang trở ghi nhận ${currentLux} Lux. Khi cường độ dưới ${threshold} Lux (trời sẩm tối), hệ thống sẽ tự động bật sáng cả 4 khu.`;
      }
    }
    // 5. CHUYỂN CHẾ ĐỘ CHIẾU SÁNG (SCENE MODES)
    else if (text.includes('tham quan') || text.includes('đón khách')) {
      state.chooseMode(0);
      actionTaken = 'Đã chuyển cảnh: Tham quan (Độ sáng 70% · 4000K)';
      reply = 'Đã chuyển sang chế độ "Tham quan". Ánh sáng vàng dịu tự nhiên, hài hòa và ấm áp, rất thích hợp cho du khách tản bộ và chụp ảnh kỷ niệm.';
    }
    else if (text.includes('lễ tưởng niệm') || text.includes('dâng hương') || text.includes('trang nghiêm')) {
      state.chooseMode(1);
      actionTaken = 'Đã chuyển cảnh: Lễ tưởng niệm (3200K Ấm áp)';
      reply = 'Đã kích hoạt chế độ "Lễ tưởng niệm". Ánh sáng chuyển sang tông ấm sâu lắng trang nghiêm để phục vụ nghi thức tưởng nhớ công ơn các anh hùng liệt sĩ và Chủ tịch Hồ Chí Minh.';
    }
    else if (text.includes('an ninh') || text.includes('bảo vệ')) {
      state.chooseMode(2);
      actionTaken = 'Đã chuyển cảnh: An ninh (100% công suất · 6000K Trắng)';
      reply = 'Đã kích hoạt chế độ "An ninh tuần tra" với độ sáng tối đa 100% giúp bao quát toàn bộ khuôn viên di tích.';
    }
    else if (text.includes('tiết kiệm') || text.includes('giảm điện')) {
      state.chooseMode(3);
      actionTaken = 'Đã chuyển cảnh: Tiết kiệm điện năng (35% công suất)';
      reply = 'Đã kích hoạt chế độ "Tiết kiệm năng lượng". Giảm tải hệ thống, tiết kiệm đến 40% điện năng tiêu thụ trong đêm khuya.';
    }
    // 6. ĐIỀU KHIỂN TRẠM 2: LED NGHỆ THUẬT RGB & CẢM BIẾN (ESP32)
    else if (text.includes('cầu vồng') || text.includes('rainbow')) {
      rgb?.setMode('rainbow');
      actionTaken = 'Trạm 2 (ESP32): Kích hoạt hiệu ứng Cầu vồng cuộn mượt';
      reply = 'Đã ra lệnh cho ESP32 bật hiệu ứng "Cầu vồng cuộn mượt" trên dải LED WS2812B (GPIO 4)!';
    }
    else if (text.includes('sao băng') || text.includes('chase')) {
      rgb?.setMode('chase');
      actionTaken = 'Trạm 2 (ESP32): Kích hoạt hiệu ứng Sao băng lướt đuổi';
      reply = 'Đã kích hoạt hiệu ứng "Sao băng đuôi sáng" trên dải LED nghệ thuật ESP32!';
    }
    else if (text.includes('ngọn lửa') || (text.includes('lửa') && text.includes('bật')) || text.includes('fire')) {
      rgb?.setMode('fire');
      actionTaken = 'Trạm 2 (ESP32): Kích hoạt hiệu ứng Ngọn lửa bập bùng';
      reply = 'Đã chuyển sang hiệu ứng "Ngọn lửa bập bùng" ấm áp phong cách chiến khu ATK.';
    }
    else if (text.includes('sóng biển') || text.includes('đại dương') || text.includes('ocean')) {
      rgb?.setMode('ocean');
      actionTaken = 'Trạm 2 (ESP32): Kích hoạt hiệu ứng Sóng biển đại dương';
      reply = 'Đã chuyển sang hiệu ứng "Sóng biển đại dương" êm dịu!';
    }
    else if (text.includes('cực quang') || text.includes('aurora')) {
      rgb?.setMode('aurora');
      actionTaken = 'Trạm 2 (ESP32): Kích hoạt hiệu ứng Cực quang huyền ảo';
      reply = 'Đã kích hoạt hiệu ứng "Cực quang huyền ảo" đa sắc!';
    }
    else if (text.includes('sóng nhạc') || text.includes('equalizer')) {
      rgb?.setMode('equalizer');
      actionTaken = 'Trạm 2 (ESP32): Kích hoạt hiệu ứng Sóng nhạc lan tỏa';
      reply = 'Đã chuyển dải LED sang hiệu ứng "Sóng nhạc Equalizer" lan tỏa từ tâm!';
    }
    else if (text.includes('disco') || text.includes('chớp') || text.includes('strobe')) {
      rgb?.setMode('strobe');
      actionTaken = 'Trạm 2 (ESP32): Kích hoạt chớp Disco vũ trường';
      reply = 'Đã kích hoạt hiệu ứng chớp nghệ thuật trên dải LED WS2812B!';
    }
    else if (text.includes('âm thanh') || text.includes('tiếng ồn') || text.includes('vỗ tay') || text.includes('micro')) {
      rgb?.setMode('sound');
      actionTaken = 'Trạm 2 (ESP32): Bật chế độ cảm biến âm thanh (GPIO 19)';
      reply = 'Đã chuyển Trạm 2 sang chế độ Cảm biến Âm thanh! Khi có tiếng ồn hoặc tiếng vỗ tay, dải LED WS2812B sẽ tự động sáng trong 5 giây.';
    }
    else if (text.includes('smart combo') || text.includes('combo')) {
      rgb?.setMode('smart_combo');
      actionTaken = 'Trạm 2 (ESP32): Kích hoạt chế độ Smart Combo';
      reply = 'Đã kích hoạt Smart Combo: Đèn chỉ sáng khi trời tối (GPIO 18) VÀ đồng thời có tiếng ồn (GPIO 19).';
    }
    else if (text.includes('màu đỏ')) {
      rgb?.setColor(255, 0, 0);
      actionTaken = 'Trạm 2 (ESP32): Đổi LED RGB sang Màu Đỏ';
      reply = 'Đã chuyển toàn bộ dải LED WS2812B sang Màu Đỏ rực rỡ!';
    }
    else if (text.includes('màu vàng')) {
      rgb?.setColor(255, 200, 0);
      actionTaken = 'Trạm 2 (ESP32): Đổi LED RGB sang Màu Vàng';
      reply = 'Đã chuyển dải LED WS2812B sang Màu Vàng kim trang trọng!';
    }
    else if (text.includes('màu cam')) {
      rgb?.setColor(255, 90, 0);
      actionTaken = 'Trạm 2 (ESP32): Đổi LED RGB sang Màu Cam';
      reply = 'Đã chuyển dải LED WS2812B sang Màu Cam hoàng hôn!';
    }
    else if (text.includes('màu xanh lá')) {
      rgb?.setColor(0, 220, 30);
      actionTaken = 'Trạm 2 (ESP32): Đổi LED RGB sang Màu Xanh Lá';
      reply = 'Đã chuyển dải LED WS2812B sang Màu Xanh Lá thiên nhiên chiến khu ATK!';
    }
    else if (text.includes('màu xanh') || text.includes('xanh dương') || text.includes('xanh biển')) {
      rgb?.setColor(0, 120, 255);
      actionTaken = 'Trạm 2 (ESP32): Đổi LED RGB sang Màu Xanh Biển';
      reply = 'Đã chuyển dải LED WS2812B sang Màu Xanh Lam dịu mát!';
    }
    else if (text.includes('màu tím')) {
      rgb?.setColor(170, 0, 255);
      actionTaken = 'Trạm 2 (ESP32): Đổi LED RGB sang Màu Tím';
      reply = 'Đã chuyển dải LED WS2812B sang Màu Tím hoa sen!';
    }
    else if (text.includes('màu trắng')) {
      rgb?.setColor(255, 255, 255);
      actionTaken = 'Trạm 2 (ESP32): Đổi LED RGB sang Màu Trắng';
      reply = 'Đã chuyển dải LED WS2812B sang Màu Trắng tinh khiết!';
    }
    else if (text.includes('tắt') && (text.includes('rgb') || text.includes('dải led') || text.includes('led'))) {
      rgb?.setMode('off');
      actionTaken = 'Trạm 2 (ESP32): Đã tắt dải LED WS2812B';
      reply = 'Đã ra lệnh cho ESP32 ngắt dải LED RGB WS2812B!';
    }
    else if (text.includes('bật') && (text.includes('rgb') || text.includes('dải led'))) {
      rgb?.setMode('rainbow');
      actionTaken = 'Trạm 2 (ESP32): Đã bật dải LED WS2812B (Cầu vồng)';
      reply = 'Đã bật sáng dải LED RGB WS2812B với hiệu ứng cầu vồng rực rỡ!';
    }
    // 7. ÂM NHẠC LỊCH SỬ
    else if (text.includes('nhạc') || text.includes('bài hát') || text.includes('âm nhạc') || text.includes('bác hồ')) {
      if (HISTORICAL_SONGS.length > 0) playSong(HISTORICAL_SONGS[0]);
      actionTaken = 'Đã phát tuyển tập Âm nhạc lịch sử dân tộc';
      reply = 'Đang phát ca khúc lịch sử hào hùng để tăng thêm phần thiêng liêng cho không gian di tích ATK Định Hóa!';
    }
    // 8. TƯ VẤN CHIẾU SÁNG THEO YÊU CẦU
    else if (text.includes('tư vấn') || text.includes('gợi ý') || text.includes('đoàn khách') || text.includes('sự kiện')) {
      reply = `🌟 GỢI Ý KỊCH BẢN CHIẾU SÁNG TOÀN DIỆN TẠI ATK ĐỊNH HÓA (2 TRẠM):
1. Từ 18:00 - 19:30 (Đón đoàn):
   • Trạm 1 (Relay): Bật đèn Quảng trường & Đồi Khau Tý (4000K).
   • Trạm 2 (ESP32): Bật LED RGB hiệu ứng Cực quang hoặc Sóng biển đón khách.
2. Từ 19:30 - 20:30 (Dâng hương trang nghiêm):
   • Trạm 1 (Relay): Kích hoạt toàn bộ đèn Nhà tưởng niệm (3200K).
   • Trạm 2 (ESP32): Chuyển LED RGB sang Màu Vàng Kim hoặc Hổ Phách trầm ấm.
3. Từ 20:30 - 21:30 (Giao lưu nghệ thuật & Thăm Lán Tỉn Keo):
   • Trạm 1 (Relay): Bật Relay Lán Tỉn Keo (D6) và phát nhạc lịch sử hào hùng.
   • Trạm 2 (ESP32): Kích hoạt chế độ Cảm biến Âm thanh (sáng theo tiếng hát/vỗ tay).
4. Sau 22:30: Chuyển sang chế độ Tiết kiệm hoặc để Cảm biến quang 2 trạm tự quản lý.`;
    }
    // 9. TÌNH TRẠNG HỆ THỐNG
    else if (text.includes('tình trạng') || text.includes('trạng thái') || text.includes('báo cáo') || text.includes('thế nào')) {
      const lit = state.lit;
      const total = state.totalLights || 168;
      const lux = state.lightSensor?.lux ?? 180;
      const rgbConnected = rgb?.connected ?? false;
      const rgbMode = rgb?.rgbState?.mode?.toUpperCase() ?? 'CHƯA RÕ';
      const rgbLeds = rgb?.rgbState?.numLeds ?? 120;
      reply = `📊 BÁO CÁO NHANH HỆ THỐNG ATK LIGHT (2 TRẠM HOẠT ĐỘNG RIÊNG BIỆT):
⚡ TRẠM 1: CHIẾU SÁNG 4 KHU (ESP8266)
• Trạng thái: ${state.connected ? 'Kết nối trực tiếp ổn định' : 'Mô phỏng'}
• Số đèn hoạt động: ${lit} / ${total} đèn
• Cảm biến ánh sáng A0: ${lux} Lux (${state.lightSensor?.isDark ? 'Trời tối' : 'Đủ sáng'})
• 4 kênh Relay: D5 (Khau Tý), D6 (Tỉn Keo), D7 (Nhà tưởng niệm), D8 (Quảng trường).

🎨 TRẠM 2: LED NGHỆ THUẬT RGB (ESP32)
• Trạng thái: ${rgbConnected ? 'Kết nối trực tiếp ổn định' : 'Chờ kết nối thiết bị'}
• Dải LED: WS2812B (${rgbLeds} bóng) · Hiệu ứng: ${rgbMode}
• Cảm biến: Quang (GPIO 18 - ${rgb?.rgbState?.isDark ? 'Tối' : 'Sáng'}) · Mic (GPIO 19 - ${rgb?.rgbState?.soundDetected ? 'Có tiếng' : 'Yên tĩnh'}).`;
    }
    // 10. CÂU HỎI MẶC ĐỊNH
    else {
      reply = `Tôi đã ghi nhận yêu cầu: "${userInput}".
Bạn có thể ra lệnh cho tôi như:
- TRẠM 1: "Bật đèn Đồi Khau Tý", "Bật toàn bộ hệ thống", "Tắt hết đèn", "Bật tự động cảm biến ánh sáng"
- TRẠM 2: "Bật hiệu ứng cầu vồng", "Bật hiệu ứng ngọn lửa", "Bật dải LED nháy theo âm thanh", "Đổi LED sang màu đỏ/vàng/xanh", "Tắt LED RGB"
- CHUNG: "Tư vấn đón đoàn khách", "Báo cáo tình trạng hệ thống"`;
    }

    return { reply, actionTaken };
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setInput('');

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const { reply, actionTaken } = processCommand(userText);
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: reply,
        actionTaken,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-new',
        sender: 'ai',
        text: 'Cuộc trò chuyện đã được làm mới. Hãy ra lệnh hoặc hỏi tôi về hệ thống chiếu sáng ATK Định Hóa!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          className="ai-floating-trigger"
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          title="Trợ lý AI Điều khiển & Tư vấn Chiếu sáng"
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '22px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '30px',
            border: '2px solid #f3dd9b',
            background: 'linear-gradient(135deg, #741d1a 0%, #3e120f 100%)',
            color: '#fff0c8',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(236,209,138,0.4)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '12px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <Bot size={18} color="#ecd18a" />
            <Sparkles size={10} color="#64b75e" style={{ position: 'absolute', top: -3, right: -4 }} />
          </div>
          <span>Trợ lý AI ATK</span>
          <span style={{
            fontSize: '9px',
            background: '#23441f',
            color: '#a3f09f',
            padding: '2px 6px',
            borderRadius: '10px',
            border: '1px solid #4a8a54'
          }}>
            Relay D5-D8
          </span>
        </button>
      )}

      {/* Chat window modal */}
      {isOpen && (
        <div
          className="ai-chat-window"
          style={{
            position: 'fixed',
            right: '18px',
            bottom: '18px',
            zIndex: 10000,
            width: isMinimized ? '320px' : 'min(420px, calc(100vw - 28px))',
            height: isMinimized ? '48px' : '560px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            border: '1px solid #94683c',
            background: 'linear-gradient(180deg, #2b0e0d 0%, #1c0808 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(236,209,138,0.15)',
            overflow: 'hidden',
            color: '#f5e4ce',
            fontSize: '12px',
            transition: 'height 0.25s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'linear-gradient(90deg, #3c120f, #260a09)',
            borderBottom: '1px solid #5a3023',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #b88a38, #5a3818)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 0 8px rgba(236,209,138,0.4)'
              }}>
                <Bot size={16} color="#fff2cc" />
              </div>
              <div>
                <strong style={{ fontSize: '12px', color: '#f3dd9b', display: 'block' }}>TRỢ LÝ AI ATK LIGHT</strong>
                <small style={{ fontSize: '9px', color: '#64b75e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#64b75e', display: 'inline-block' }} />
                  Điều khiển trực tiếp Relay & Cảm biến quang
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={clearChat}
                title="Xóa lịch sử chat"
                style={{ padding: '5px', color: '#c3aa93', borderRadius: '4px' }}
              >
                <Trash2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                style={{ padding: '5px', color: '#c3aa93', borderRadius: '4px' }}
              >
                {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng trợ lý AI"
                style={{ padding: '5px', color: '#c3aa93', borderRadius: '4px' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages list */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'radial-gradient(ellipse at 50% 0, #38120f 0%, #1b0707 70%)',
              }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        padding: '9px 13px',
                        borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: m.sender === 'user'
                          ? 'linear-gradient(135deg, #b58b42 0%, #7d5722 100%)'
                          : 'linear-gradient(135deg, #371714 0%, #260e0d 100%)',
                        color: m.sender === 'user' ? '#1c0c08' : '#faebd7',
                        border: m.sender === 'user' ? '1px solid #ecd18a' : '1px solid #633c29',
                        lineHeight: 1.5,
                        fontSize: '11.5px',
                        whiteSpace: 'pre-wrap',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      {m.text}
                    </div>

                    {/* Action badge if command was executed */}
                    {m.actionTaken && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 8px',
                        background: '#1a3b1d',
                        border: '1px solid #4a8a54',
                        borderRadius: '6px',
                        color: '#bdf5b8',
                        fontSize: '10px',
                        fontWeight: 500,
                      }}>
                        <CheckCircle2 size={12} color="#64b75e" />
                        <span>{m.actionTaken}</span>
                      </div>
                    )}

                    <small style={{
                      fontSize: '8px',
                      color: '#988070',
                      alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      padding: '0 4px',
                    }}>
                      {m.timestamp}
                    </small>
                  </div>
                ))}

                {isTyping && (
                  <div style={{
                    alignSelf: 'flex-start',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: '#301311',
                    color: '#ecd18a',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <Sparkles size={13} className="spin-slow" />
                    <span>AI đang phân tích và ra lệnh thiết bị...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions */}
              <div style={{
                padding: '8px 10px 4px',
                background: '#220b0a',
                borderTop: '1px solid #452119',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: '#381613',
                      border: '1px solid #6b402e',
                      color: '#ecd18a',
                      fontSize: '9.5px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input bar */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px',
                  background: '#1d0807',
                  borderTop: '1px solid #5a3023',
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhắn lệnh (vd: Bật đèn Khau Tý, Tắt hết, Tư vấn)..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#351412',
                    border: '1px solid #704732',
                    color: '#fff',
                    fontSize: '11.5px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: input.trim() ? 'linear-gradient(135deg, #d8a649, #a06e23)' : '#40201c',
                    color: input.trim() ? '#200c06' : '#705047',
                    border: 'none',
                    fontWeight: 600,
                    cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Send size={13} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

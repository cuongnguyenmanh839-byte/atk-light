export interface HistoricalSong {
  id: string;
  title: string;
  composer: string;
  year: string;
  era: string;
  description: string;
  src?: string;
  notes?: Array<{ freq: number; dur: number }>;
  lyrics: string;
  tag: 'QUỐC_CA' | 'HÀO_KHÍ' | 'CÁCH_MẠNG';
}

export const HISTORICAL_SONGS: HistoricalSong[] = [
  {
    id: 'tien-quan-ca',
    title: 'Tiến Quân Ca (Quốc Ca)',
    composer: 'Văn Cao',
    year: '1944',
    era: 'Kháng chiến chống Pháp & Khai sinh nước VNDCCH',
    description:
      'Quốc ca của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam, được nhạc sĩ Văn Cao sáng tác vào mùa đông năm 1944. Bài hát là lời hiệu triệu thiêng liêng đồng bào cả nước đứng lên giành độc lập tự do cho Tổ quốc.',
    src: '/audio/tien-quan-ca.ogg',
    tag: 'QUỐC_CA',
    lyrics: `Đoàn quân Việt Nam đi, chung lòng cứu quốc
Bước chân dồn vang trên đường gập ghềnh xa
Cờ in máu chiến thắng mang hồn nước
Súng ngoài xa chen khúc quân hành ca.

Đường vinh quang xây xác quân thù
Thắng gian lao cùng nhau lập chiến khu.
Vì nhân dân chiến đấu không ngừng
Tiến mau ra sa trường!
Tiến lên! Cùng tiến lên!
Nước non Việt Nam ta vững bền.`,
  },
  {
    id: 'quoc-ca-viet-nam',
    title: 'Quốc Thiều Việt Nam (Hòa tấu Nghi lễ)',
    composer: 'Văn Cao / Dàn Quân Nhạc',
    year: '1944 - 1976',
    era: 'Nghi lễ Quốc gia',
    description:
      'Bản hòa tấu khí nhạc trang nghiêm của Quốc ca Việt Nam, được cử hành trong các buổi lễ thượng cờ, duyệt binh và các sự kiện ngoại giao, lịch sử trọng đại của dân tộc.',
    src: '/audio/quoc-ca-viet-nam.ogg',
    tag: 'QUỐC_CA',
    lyrics: `(Bản hòa tấu khí nhạc nghi lễ Quốc gia trang nghiêm - Nhạc sĩ Văn Cao)`,
  },
  {
    id: 'tien-quan-ca-1946',
    title: 'Tiến Quân Ca (Bản thu Lịch sử Chiến khu 1946)',
    composer: 'Văn Cao',
    year: '1946',
    era: 'Chiến khu Việt Bắc & ATK Định Hóa',
    description:
      'Bản thu âm nguyên bản lịch sử năm 1946 thời kỳ Toàn quốc kháng chiến, khi Chủ tịch Hồ Chí Minh và Trung ương Đảng lãnh đạo cách mạng tại An toàn khu (ATK) Định Hóa - Thái Nguyên.',
    src: '/audio/tien-quan-ca-1946.ogg',
    tag: 'QUỐC_CA',
    lyrics: `Đoàn quân Việt Nam đi, chung lòng cứu quốc
Bước chân dồn vang trên đường gập ghềnh xa
Cờ in máu chiến thắng mang hồn nước
Súng ngoài xa chen khúc quân hành ca...`,
  },
  {
    id: 'hao-khi-viet-nam',
    title: 'Hào Khí Việt Nam',
    composer: 'Holy Thắng',
    year: '2010',
    era: '4000 năm Lịch sử Dựng nước & Giữ nước',
    description:
      'Bản hùng ca ngợi ca khí phách kiên cường bất khuất của dân tộc Việt Nam suốt bốn ngàn năm lịch sử, từ thuở Vua Hùng dựng nước, Hai Bà Trưng, Ngô Quyền trên sông Bạch Đằng, Hưng Đạo Đại Vương Trần Quốc Tuấn, đến thời đại Hồ Chí Minh rực rỡ chiến công.',
    notes: [
      { freq: 440, dur: 0.4 }, { freq: 493.88, dur: 0.4 }, { freq: 554.37, dur: 0.6 },
      { freq: 659.25, dur: 0.8 }, { freq: 554.37, dur: 0.4 }, { freq: 493.88, dur: 0.4 },
      { freq: 440, dur: 1.0 }, { freq: 329.63, dur: 0.6 }, { freq: 440, dur: 0.8 },
      { freq: 554.37, dur: 0.8 }, { freq: 659.25, dur: 1.2 }, { freq: 739.99, dur: 0.8 },
      { freq: 659.25, dur: 0.6 }, { freq: 554.37, dur: 0.6 }, { freq: 440, dur: 1.4 }
    ],
    tag: 'HÀO_KHÍ',
    lyrics: `Việt Nam ơi giống hùng thiêng
Ngàn năm lưu danh sử sách
Mẹ Âu Cơ sinh trăm trứng, nở trăm con
Năm mươi lên non, năm mươi xuống biển.

Lời Bác dạy sáng soi muôn đời
Bốn ngàn năm lịch sử hào hùng
Bao máu xương gìn giữ non sông
Việt Nam kiên trung ngẩng cao đầu!`,
  },
  {
    id: 'dong-mau-lac-hong',
    title: 'Dòng Máu Lạc Hồng',
    composer: 'Lê Quang',
    year: '2000',
    era: 'Cội nguồn Dân tộc Tiên Rồng',
    description:
      'Giai điệu rực cháy lòng tự hào dân tộc, nhắc nhở thế hệ hôm nay và mai sau luôn ghi nhớ dòng máu Lạc Hồng, con Rồng cháu Tiên kiên cường, bất khuất trước mọi bão táp lịch sử.',
    notes: [
      { freq: 523.25, dur: 0.5 }, { freq: 587.33, dur: 0.5 }, { freq: 659.25, dur: 0.8 },
      { freq: 783.99, dur: 0.8 }, { freq: 659.25, dur: 0.5 }, { freq: 587.33, dur: 0.5 },
      { freq: 523.25, dur: 1.2 }, { freq: 392.00, dur: 0.6 }, { freq: 523.25, dur: 0.8 },
      { freq: 659.25, dur: 1.0 }, { freq: 783.99, dur: 1.5 }
    ],
    tag: 'HÀO_KHÍ',
    lyrics: `Dòng máu Lạc Hồng, bốn nghìn năm
Dòng máu đỏ tươi chảy trong tim mình
Nòi giống Lạc Hồng, giống Rồng Tiên
Nguyện ôm lấy đất mẹ yêu thương!

Dù qua bao gian lao thác ghềnh
Lòng son sắt vững bước đi lên
Việt Nam quê hương ta ngàn đời sáng tươi!`,
  },
  {
    id: 'bac-dang-cung-chung-chau-hanh-quan',
    title: 'Bác Đang Cùng Chúng Cháu Hành Quân',
    composer: 'Huy Thục',
    year: '1969',
    era: 'Kháng chiến chống Mỹ & Ký ức ATK',
    description:
      'Bài hát gắn bó sâu sắc với ký ức về Bác Hồ và mảnh đất Chiến khu Việt Bắc - ATK Định Hóa. Hình ảnh Người soi đường chỉ lối cho toàn quân toàn dân ta tiến bước đi đến ngày toàn thắng.',
    notes: [
      { freq: 392, dur: 0.4 }, { freq: 440, dur: 0.4 }, { freq: 523.25, dur: 0.6 },
      { freq: 587.33, dur: 0.6 }, { freq: 659.25, dur: 0.8 }, { freq: 523.25, dur: 0.4 },
      { freq: 440, dur: 0.4 }, { freq: 392, dur: 1.0 }
    ],
    tag: 'CÁCH_MẠNG',
    lyrics: `Đêm nay trên đường hành quân ra mặt trận
Trùng trùng đoàn quân tiến bước theo nhịp rung
Lòng ta sáng rực niềm tin chiến thắng
Như có Bác Hồ đang cùng chúng cháu hành quân!

Bác vẫn cùng chúng cháu hành quân
Vì độc lập tự do của Tổ quốc thân yêu!`,
  },
  {
    id: 'giai-phong-dien-bien',
    title: 'Giải Phóng Điện Biên',
    composer: 'Đỗ Nhuận',
    year: '1954',
    era: 'Chiến thắng Điện Biên Phủ lừng lẫy năm châu',
    description:
      'Sáng tác bất hủ của nhạc sĩ Đỗ Nhuận trong chiến dịch Điện Biên Phủ lịch sử (1954), nơi kế hoạch tác chiến được Bộ Chính trị và Bác Hồ phê duyệt ngay tại ATK Định Hóa.',
    notes: [
      { freq: 440, dur: 0.5 }, { freq: 554.37, dur: 0.5 }, { freq: 659.25, dur: 0.8 },
      { freq: 880, dur: 1.0 }, { freq: 739.99, dur: 0.6 }, { freq: 659.25, dur: 0.6 }
    ],
    tag: 'CÁCH_MẠNG',
    lyrics: `Giải phóng Điện Biên, bộ đội ta tiến quân trở về
Giữa mùa này hoa nở miền Tây Bắc tưng bừng
Bản mường xưa vui đón quân về chan hòa
Mừng chiến thắng Điện Biên lẫy lừng năm châu!`,
  },
  {
    id: 'dat-nuoc-tron-niem-vui',
    title: 'Đất Nước Trọn Niềm Vui',
    composer: 'Hoàng Hà',
    year: '1975',
    era: 'Đại thắng mùa Xuân 1975',
    description:
      'Khúc ca khải hoàn rực rỡ chào mừng ngày non sông thống nhất, Bắc Nam sum họp một nhà, cờ đỏ sao vàng tung bay trên nóc Dinh Độc Lập.',
    notes: [
      { freq: 523.25, dur: 0.4 }, { freq: 659.25, dur: 0.4 }, { freq: 783.99, dur: 0.8 },
      { freq: 1046.5, dur: 1.2 }, { freq: 880, dur: 0.6 }, { freq: 783.99, dur: 0.8 }
    ],
    tag: 'CÁCH_MẠNG',
    lyrics: `Ta đi trong muôn ánh sao vàng, cờ đỏ tung bay
Rộn ràng nghe tiếng ca vang vọng khắp non sông
Đất nước trọn niềm vui, Nam Bắc chung một nhà
Hồ Chí Minh sáng ngời tên Người!`,
  },
];

export interface AreaMusicMapping {
  songId: string;
  areaName: string;
  songTitle: string;
}

export const AREA_SONG_MAPPING: Record<string, AreaMusicMapping> = {
  'khau-ty': {
    songId: 'bac-dang-cung-chung-chau-hanh-quan',
    areaName: 'Đồi Khau Tý',
    songTitle: 'Bác Đang Cùng Chúng Cháu Hành Quân',
  },
  'tin-keo': {
    songId: 'tien-quan-ca-1946',
    areaName: 'Lán Tỉn Keo',
    songTitle: 'Tiến Quân Ca (Chiến khu ATK 1946)',
  },
  'memorial': {
    songId: 'quoc-ca-viet-nam',
    areaName: 'Nhà tưởng niệm',
    songTitle: 'Quốc Thiều Việt Nam (Nghi lễ)',
  },
  'square': {
    songId: 'hao-khi-viet-nam',
    areaName: 'Quảng trường',
    songTitle: 'Hào Khí Việt Nam',
  },
};

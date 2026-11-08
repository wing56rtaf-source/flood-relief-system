/**
 * Local Landmark & Alias Dictionary for Hat Yai, Songkhla, and Khlong Hoi Khong
 * RTAF Flood Relief Operations System
 * 
 * ใช้สำหรับการค้นหาแบบ Fast Instant Match (< 10ms)
 * ครอบคลุมคำย่อ, ภาษาพูด, ชุมชน, ซอยย่อย, ศูนย์ราชการ, โรงพยาบาล และจุดเสี่ยงน้ำท่วมซ้ำซาก
 * ข้อมูลหลัก: คลังพจนานุกรมแลนด์มาร์กหาดใหญ่-คลองหอยโข่ง (รวม 183 สถานที่)
 */

export interface LocalLandmark {
  id: string;
  name: string;             // ชื่อทางการ
  aliases: string[];        // คำย่อ / ภาษาพูด
  category: 'UNIVERSITY' | 'HOSPITAL' | 'MALL' | 'COMMUNITY' | 'GOVERNMENT' | 'TRANSPORT' | 'FLOOD_RISK';
  latitude: number;
  longitude: number;
  subdistrict: string;      // ตำบล
  district: string;         // อำเภอ
  province: string;         // จังหวัด
  description?: string;     // จุดสังเกตเพิ่มเติม
}

export const HATYAI_BOUNDING_BOX = {
  minLat: 6.80,
  maxLat: 7.25,
  minLng: 100.25,
  maxLng: 100.70,
};

export const HATYAI_LANDMARKS: LocalLandmark[] = [
  {
    "id": "lm-hospital-1",
    "name": "โรงพยาบาลสงขลานครินทร์",
    "aliases": [
      "รพ.มอ.",
      "โรงหมอมอ.",
      "รพ.สงขลานครินทร์",
      "มอ."
    ],
    "category": "HOSPITAL",
    "latitude": 7.0079,
    "longitude": 100.4942,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ตั้งอยู่ในมหาวิทยาลัยสงขลานครินทร์ ติดถนนกาญจนวนิช"
  },
  {
    "id": "lm-hospital-2",
    "name": "โรงพยาบาลหาดใหญ่",
    "aliases": [
      "รพ.หาดใหญ่",
      "โรงหมอหาดใหญ่",
      "ตึก 50 ปี รพ.หาดใหญ่"
    ],
    "category": "HOSPITAL",
    "latitude": 7.0168,
    "longitude": 100.467,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนรัถการ ใกล้สะพานลอยข้ามทางรถไฟ"
  },
  {
    "id": "lm-hospital-3",
    "name": "โรงพยาบาลศิครินทร์ หาดใหญ่",
    "aliases": [
      "รพ.ศิครินทร์",
      "ศิครินทร์",
      "ศิครินทร์หาดใหญ่"
    ],
    "category": "HOSPITAL",
    "latitude": 7.0224,
    "longitude": 100.4702,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนนิพัทธ์สงเคราะห์ 1 ใกล้สนามกีฬากลางจิระนคร"
  },
  {
    "id": "lm-hospital-4",
    "name": "โรงพยาบาลกรุงเทพหาดใหญ่",
    "aliases": [
      "รพ.กรุงเทพ",
      "กรุงเทพหาดใหญ่",
      "ซอย 15 เพชรเกษม"
    ],
    "category": "HOSPITAL",
    "latitude": 7.0094,
    "longitude": 100.4872,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม ซอย 15 ใกล้บิ๊กซีเอ็กซ์ตร้า"
  },
  {
    "id": "lm-hospital-5",
    "name": "โรงพยาบาลราษฎร์ยินดี",
    "aliases": [
      "รพ.ราษฎร์ยินดี",
      "ราษฎร์ยินดี",
      "รพ.30เมตร"
    ],
    "category": "HOSPITAL",
    "latitude": 7.0015,
    "longitude": 100.4802,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนราษฎร์ยินดี (ถนน 30 เมตร)"
  },
  {
    "id": "lm-hospital-6",
    "name": "โรงพยาบาลค่ายเสนาณรงค์",
    "aliases": [
      "รพ.ค่ายเสนา",
      "รพ.ทหารหาดใหญ่",
      "รพ.ค่ายเสนาณรงค์"
    ],
    "category": "HOSPITAL",
    "latitude": 7.0268,
    "longitude": 100.4988,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "หน้าค่ายเสนาณรงค์ ถนนกาญจนวนิช"
  },
  {
    "id": "lm-hospital-7",
    "name": "โรงพยาบาลมิตรภาพสามัคคี (มูลนิธิท่งเซียเซี่ยงตึ๊ง)",
    "aliases": [
      "ท่งเซียเซี่ยงตึ๊ง",
      "มูลนิธิมิตรภาพสามัคคี",
      "กู้ภัยท่งเซีย",
      "รพ.ท่งเซีย"
    ],
    "category": "HOSPITAL",
    "latitude": 7.0095,
    "longitude": 100.4762,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนศุภสารรังสรรค์ ศูนย์กู้ภัยหลักกลางเมืองหาดใหญ่"
  },
  {
    "id": "lm-hospital-8",
    "name": "โรงพยาบาลหาดใหญ่-นาหม่อม (ศูนย์แพทย์ชุมชนคลองแห)",
    "aliases": [
      "ศูนย์แพทย์คลองแห",
      "รพ.สต.คลองแห"
    ],
    "category": "HOSPITAL",
    "latitude": 7.0432,
    "longitude": 100.4755,
    "subdistrict": "คลองแห",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใกล้สำนักงานเทศบาลเมืองคลองแห"
  },
  {
    "id": "lm-hospital-9",
    "name": "โรงพยาบาลส่งเสริมสุขภาพตำบลควนลัง",
    "aliases": [
      "รพ.สต.ควนลัง",
      "อนามัยควนลัง"
    ],
    "category": "HOSPITAL",
    "latitude": 6.9885,
    "longitude": 100.4312,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษมสายเก่า ตำบลควนลัง"
  },
  {
    "id": "lm-hospital-10",
    "name": "โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านพรุ",
    "aliases": [
      "รพ.สต.บ้านพรุ",
      "อนามัยบ้านพรุ",
      "ศูนย์แพทย์บ้านพรุ"
    ],
    "category": "HOSPITAL",
    "latitude": 6.9425,
    "longitude": 100.4682,
    "subdistrict": "บ้านพรุ",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "เขตเทศบาลเมืองบ้านพรุ"
  },
  {
    "id": "lm-hospital-11",
    "name": "โรงพยาบาลส่งเสริมสุขภาพตำบลพะตง",
    "aliases": [
      "รพ.สต.พะตง",
      "อนามัยพะตง",
      "อนามัยทุ่งลุง"
    ],
    "category": "HOSPITAL",
    "latitude": 6.892,
    "longitude": 100.4735,
    "subdistrict": "พะตง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านตลาดทุ่งลุง ถนนกาญจนวนิช"
  },
  {
    "id": "lm-hospital-12",
    "name": "โรงพยาบาลส่งเสริมสุขภาพตำบลคูเต่า",
    "aliases": [
      "รพ.สต.คูเต่า",
      "อนามัยคูเต่า"
    ],
    "category": "HOSPITAL",
    "latitude": 7.0954,
    "longitude": 100.448,
    "subdistrict": "คูเต่า",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใกล้คลองอู่ตะเภา ตอนปลาย"
  },
  {
    "id": "lm-hospital-13",
    "name": "โรงพยาบาลคลองหอยโข่ง",
    "aliases": [
      "รพ.คลองหอยโข่ง",
      "โรงหมอคลองหอยโข่ง"
    ],
    "category": "HOSPITAL",
    "latitude": 6.8986,
    "longitude": 100.3752,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ถนนโคกม่วง-บ้านเหนือ ใกล้ที่ว่าการอำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-hospital-14",
    "name": "โรงพยาบาลกองบิน 56",
    "aliases": [
      "รพ.กองบิน 56",
      "รพ.บน.56",
      "แพทย์กองบิน 56"
    ],
    "category": "HOSPITAL",
    "latitude": 6.9325,
    "longitude": 100.3985,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ภายในเขตกองบิน 56 ติดสนามบินหาดใหญ่"
  },
  {
    "id": "lm-hospital-15",
    "name": "โรงพยาบาลส่งเสริมสุขภาพตำบลโคกม่วง",
    "aliases": [
      "รพ.สต.โคกม่วง",
      "อนามัยโคกม่วง"
    ],
    "category": "HOSPITAL",
    "latitude": 6.9015,
    "longitude": 100.4178,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ใกล้เทศบาลตำบลโคกม่วง"
  },
  {
    "id": "lm-hospital-16",
    "name": "โรงพยาบาลส่งเสริมสุขภาพตำบลทุ่งลาน",
    "aliases": [
      "รพ.สต.ทุ่งลาน",
      "อนามัยทุ่งลาน"
    ],
    "category": "HOSPITAL",
    "latitude": 6.8685,
    "longitude": 100.436,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลทุ่งลาน เส้นเชื่อมทุ่งลุง-คลองหอยโข่ง"
  },
  {
    "id": "lm-hospital-17",
    "name": "โรงพยาบาลส่งเสริมสุขภาพตำบลคลองหลา",
    "aliases": [
      "รพ.สต.คลองหลา",
      "อนามัยคลองหลา"
    ],
    "category": "HOSPITAL",
    "latitude": 6.948,
    "longitude": 100.382,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ใกล้ อบต.คลองหลา และคลองหลา"
  },
  {
    "id": "lm-government-18",
    "name": "กองบิน 56 (ฐานทัพอากาศหาดใหญ่)",
    "aliases": [
      "บน.56",
      "กองบิน56",
      "กองบินหาดใหญ่",
      "ทอ.หาดใหญ่"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.9348,
    "longitude": 100.3955,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ศูนย์ปฏิบัติการช่วยเหลือผู้ประสบอุทกภัย ทอ. ติดสนามบินหาดใหญ่"
  },
  {
    "id": "lm-government-19",
    "name": "ค่ายเสนาณรงค์ (มณฑลทหารบกที่ 42)",
    "aliases": [
      "ค่ายเสนา",
      "ค่ายเสนาณรงค์",
      "มทบ.42",
      "ค่ายทหารคอหงส์"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.0285,
    "longitude": 100.5012,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช ตรงข้ามสวนสาธารณะหาดใหญ่"
  },
  {
    "id": "lm-government-20",
    "name": "ค่ายรัตนพล (กองพลพัฒนาที่ 4)",
    "aliases": [
      "ค่ายรัตนพล",
      "พล.พัฒนา4",
      "ค่ายทหารคลองหอยโข่ง"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.8942,
    "longitude": 100.352,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "หมู่ที่ 3 ตำบลคลองหอยโข่ง ถนนสายสนามบิน-คลองหอยโข่ง"
  },
  {
    "id": "lm-government-21",
    "name": "สำนักงานเทศบาลนครหาดใหญ่",
    "aliases": [
      "เทศบาลหาดใหญ่",
      "ทน.หาดใหญ่",
      "หน้าเทศบาล"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.0086,
    "longitude": 100.4747,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม ใกล้หอนาฬิกาหาดใหญ่"
  },
  {
    "id": "lm-government-22",
    "name": "ที่ว่าการอำเภอหาดใหญ่",
    "aliases": [
      "อำเภอหาดใหญ่",
      "ที่ว่าการอำเภอหาดใหญ่"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.0112,
    "longitude": 100.4718,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม ใกล้แยกสะพานลอยข้ามทางรถไฟ"
  },
  {
    "id": "lm-government-23",
    "name": "สถานีตำรวจภูธรหาดใหญ่",
    "aliases": [
      "สภ.หาดใหญ่",
      "โรงพักหาดใหญ่"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.0052,
    "longitude": 100.4698,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนรัถการ ใกล้สถานีรถไฟหาดใหญ่"
  },
  {
    "id": "lm-government-24",
    "name": "สถานีตำรวจภูธรคอหงส์",
    "aliases": [
      "สภ.คอหงส์",
      "โรงพักคอหงส์"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.0185,
    "longitude": 100.496,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ดูแลพื้นที่ฝั่งตะวันออก ม.อ. และคอหงส์"
  },
  {
    "id": "lm-government-25",
    "name": "สถานีตำรวจภูธรหาดใหญ่ (สาขาย่อยคลองแห)",
    "aliases": [
      "ป้อมคลองแห",
      "โรงพักคลองแห"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.041,
    "longitude": 100.473,
    "subdistrict": "คลองแห",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "บริเวณแยกคลองแห"
  },
  {
    "id": "lm-government-26",
    "name": "สถานีตำรวจภูธรทุ่งลุง",
    "aliases": [
      "สภ.ทุ่งลุง",
      "โรงพักทุ่งลุง"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.895,
    "longitude": 100.4742,
    "subdistrict": "พะตง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช ตำบลพะตง"
  },
  {
    "id": "lm-government-27",
    "name": "ที่ว่าการอำเภอคลองหอยโข่ง",
    "aliases": [
      "อำเภอคลองหอยโข่ง",
      "ที่ว่าการคลองหอยโข่ง"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.8992,
    "longitude": 100.3886,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ถนนโคกม่วง-บ้านเหนือ ตำบลคลองหอยโข่ง"
  },
  {
    "id": "lm-government-28",
    "name": "สถานีตำรวจภูธรคลองหอยโข่ง",
    "aliases": [
      "สภ.คลองหอยโข่ง",
      "โรงพักคลองหอยโข่ง"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.9001,
    "longitude": 100.3895,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ติดกับที่ว่าการอำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-government-29",
    "name": "สำนักงานเทศบาลเมืองคอหงส์",
    "aliases": [
      "เทศบาลคอหงส์",
      "ทม.คอหงส์"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.0315,
    "longitude": 100.5065,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใกล้ค่ายเสนาณรงค์และสวนสาธารณะหาดใหญ่"
  },
  {
    "id": "lm-government-30",
    "name": "สำนักงานเทศบาลเมืองคลองแห",
    "aliases": [
      "เทศบาลคลองแห",
      "ทม.คลองแห"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.0445,
    "longitude": 100.476,
    "subdistrict": "คลองแห",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนลพบุรีราเมศวร์ ตำบลคลองแห"
  },
  {
    "id": "lm-government-31",
    "name": "สำนักงานเทศบาลเมืองควนลัง",
    "aliases": [
      "เทศบาลควนลัง",
      "ทม.ควนลัง"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.992,
    "longitude": 100.4335,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม (สายสนามบิน)"
  },
  {
    "id": "lm-government-32",
    "name": "สำนักงานเทศบาลเมืองบ้านพรุ",
    "aliases": [
      "เทศบาลบ้านพรุ",
      "ทม.บ้านพรุ"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.944,
    "longitude": 100.4695,
    "subdistrict": "บ้านพรุ",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช ตำบลบ้านพรุ"
  },
  {
    "id": "lm-government-33",
    "name": "สำนักงานเทศบาลเมืองทุ่งตำเสา",
    "aliases": [
      "เทศบาลทุ่งตำเสา",
      "ทม.ทุ่งตำเสา"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.968,
    "longitude": 100.371,
    "subdistrict": "ทุ่งตำเสา",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ทางไปน้ำตกโตนงาช้าง"
  },
  {
    "id": "lm-government-34",
    "name": "สำนักงานเทศบาลตำบลพะตง",
    "aliases": [
      "เทศบาลพะตง",
      "ทต.พะตง"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.8895,
    "longitude": 100.476,
    "subdistrict": "พะตง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านทุ่งลุง ตำบลพะตง"
  },
  {
    "id": "lm-government-35",
    "name": "สำนักงานเทศบาลตำบลบ้านไร่ (บ้านพรุ)",
    "aliases": [
      "เทศบาลบ้านไร่",
      "ทต.บ้านไร่"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.9585,
    "longitude": 100.485,
    "subdistrict": "บ้านพรุ",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "โซนตะวันออกของตำบลบ้านพรุ"
  },
  {
    "id": "lm-government-36",
    "name": "สำนักงานเทศบาลตำบลน้ำน้อย",
    "aliases": [
      "เทศบาลน้ำน้อย",
      "ทต.น้ำน้อย"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.078,
    "longitude": 100.526,
    "subdistrict": "น้ำน้อย",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช สายหาดใหญ่-สงขลา"
  },
  {
    "id": "lm-government-37",
    "name": "สำนักงานเทศบาลตำบลคูเต่า",
    "aliases": [
      "เทศบาลคูเต่า",
      "ทต.คูเต่า"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.098,
    "longitude": 100.451,
    "subdistrict": "คูเต่า",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ตำบลคูเต่า ริมคลองอู่ตะเภา"
  },
  {
    "id": "lm-government-38",
    "name": "องค์การบริหารส่วนตำบลท่าข้าม",
    "aliases": [
      "อบต.ท่าข้าม",
      "ท่าข้ามหาดใหญ่"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.058,
    "longitude": 100.542,
    "subdistrict": "ท่าข้าม",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "สายหาดใหญ่-สงขลา (ลพบุรีราเมศวร์/กาญจนวนิช)"
  },
  {
    "id": "lm-government-39",
    "name": "องค์การบริหารส่วนตำบลคลองอู่ตะเภา",
    "aliases": [
      "อบต.คลองอู่ตะเภา"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.065,
    "longitude": 100.458,
    "subdistrict": "คลองอู่ตะเภา",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "พื้นที่ลุ่มน้ำคลองอู่ตะเภาตอนล่าง"
  },
  {
    "id": "lm-government-40",
    "name": "องค์การบริหารส่วนตำบลฉลุง",
    "aliases": [
      "อบต.ฉลุง",
      "ฉลุงหาดใหญ่"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.015,
    "longitude": 100.365,
    "subdistrict": "ฉลุง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ทิศตะวันตกของอำเภอหาดใหญ่"
  },
  {
    "id": "lm-government-41",
    "name": "องค์การบริหารส่วนตำบลทุ่งใหญ่",
    "aliases": [
      "อบต.ทุ่งใหญ่",
      "ทุ่งใหญ่หาดใหญ่"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.048,
    "longitude": 100.515,
    "subdistrict": "ทุ่งใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ทิศตะวันออกเฉียงเหนือของหาดใหญ่"
  },
  {
    "id": "lm-government-42",
    "name": "สำนักงานเทศบาลตำบลโคกม่วง",
    "aliases": [
      "เทศบาลโคกม่วง",
      "ทต.โคกม่วง"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.9011,
    "longitude": 100.4176,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "หมู่ที่ 7 ตำบลโคกม่วง อำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-government-43",
    "name": "สำนักงานเทศบาลตำบลทุ่งลาน",
    "aliases": [
      "เทศบาลทุ่งลาน",
      "ทต.ทุ่งลาน"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.8672,
    "longitude": 100.4385,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "หมู่ที่ 9 ตำบลทุ่งลาน อำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-government-44",
    "name": "องค์การบริหารส่วนตำบลคลองหอยโข่ง",
    "aliases": [
      "อบต.คลองหอยโข่ง"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.8975,
    "longitude": 100.384,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหอยโข่ง ใกล้ที่ว่าการอำเภอ"
  },
  {
    "id": "lm-government-45",
    "name": "องค์การบริหารส่วนตำบลคลองหลา",
    "aliases": [
      "อบต.คลองหลา"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.951,
    "longitude": 100.3855,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหลา ทางทิศเหนือของสนามบินหาดใหญ่"
  },
  {
    "id": "lm-government-46",
    "name": "ศูนย์ป้องกันและบรรเทาสาธารณภัย เขต 12 สงขลา",
    "aliases": [
      "ปภ.เขต 12",
      "ศูนย์ ปภ.หาดใหญ่",
      "ปภ.ควนลัง"
    ],
    "category": "GOVERNMENT",
    "latitude": 6.9855,
    "longitude": 100.418,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนสนามบิน-ลพบุรีราเมศวร์ ตำบลควนลัง"
  },
  {
    "id": "lm-government-47",
    "name": "สำนักงานชลประทานที่ 16 (สงขลา)",
    "aliases": [
      "ชลประทานหาดใหญ่",
      "ชลประทานที่ 16",
      "ชลประทานคลองแห"
    ],
    "category": "GOVERNMENT",
    "latitude": 7.032,
    "longitude": 100.4715,
    "subdistrict": "คลองแห",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดติดตามระดับน้ำคลองอู่ตะเภาและคลอง ร.1"
  },
  {
    "id": "lm-transport-48",
    "name": "ท่าอากาศยานนานาชาติหาดใหญ่",
    "aliases": [
      "สนามบินหาดใหญ่",
      "ท่าอากาศยานหาดใหญ่",
      "สนามบิน"
    ],
    "category": "TRANSPORT",
    "latitude": 6.9362,
    "longitude": 100.3915,
    "subdistrict": "คลองหลา / โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "พื้นที่รอยต่อ ต.คลองหลา อ.คลองหอยโข่ง และ ต.ควนลัง อ.หาดใหญ่"
  },
  {
    "id": "lm-transport-49",
    "name": "สถานีรถไฟชุมทางหาดใหญ่",
    "aliases": [
      "สถานีรถไฟหาดใหญ่",
      "รถไฟหาดใหญ่",
      "หน้าสถานีรถไฟ"
    ],
    "category": "TRANSPORT",
    "latitude": 7.0038,
    "longitude": 100.4677,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใจกลางเมืองหาดใหญ่ ปลายถนนธรรมนูญวิถี"
  },
  {
    "id": "lm-transport-50",
    "name": "สถานีขนส่งผู้โดยสารอำเภอหาดใหญ่ แห่งที่ 1",
    "aliases": [
      "บขส.หาดใหญ่",
      "ขนส่งหาดใหญ่",
      "บขส.เซ็ลทรัล",
      "ขนส่งเปิดท้าย"
    ],
    "category": "TRANSPORT",
    "latitude": 6.9912,
    "longitude": 100.4835,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใกล้เซ็นทรัลเฟสติวัล และอาเซียนไนท์บาซาร์"
  },
  {
    "id": "lm-transport-51",
    "name": "สถานีขนส่งผู้โดยสารอำเภอหาดใหญ่ แห่งที่ 2 (ตลาดเกษตร)",
    "aliases": [
      "บขส.ตลาดเกษตร",
      "คิวรถตู้ตลาดเกษตร",
      "ขนส่งตลาดเกษตร"
    ],
    "category": "TRANSPORT",
    "latitude": 6.9989,
    "longitude": 100.4455,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม ฝั่งหาดใหญ่ใน-ควนลัง"
  },
  {
    "id": "lm-transport-52",
    "name": "สถานีรถไฟบ้านพรุ",
    "aliases": [
      "สถานีรถไฟบ้านพรุ",
      "รถไฟบ้านพรุ"
    ],
    "category": "TRANSPORT",
    "latitude": 6.9415,
    "longitude": 100.466,
    "subdistrict": "บ้านพรุ",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "เส้นทางรถไฟสายหาดใหญ่-ปาดังเบซาร์"
  },
  {
    "id": "lm-transport-53",
    "name": "สถานีรถไฟศาลาทุ่งลุง",
    "aliases": [
      "สถานีรถไฟทุ่งลุง",
      "ศาลาทุ่งลุง"
    ],
    "category": "TRANSPORT",
    "latitude": 6.8935,
    "longitude": 100.469,
    "subdistrict": "พะตง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ตำบลพะตง เส้นทางรถไฟสายปาดังเบซาร์"
  },
  {
    "id": "lm-transport-54",
    "name": "สถานีรถไฟคลองหอยโข่ง",
    "aliases": [
      "สถานีรถไฟคลองหอยโข่ง",
      "รถไฟคลองหอยโข่ง"
    ],
    "category": "TRANSPORT",
    "latitude": 6.885,
    "longitude": 100.391,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหอยโข่ง"
  },
  {
    "id": "lm-transport-55",
    "name": "สถานีรถไฟบ้านดินลาน",
    "aliases": [
      "สถานีรถไฟดินลาน",
      "รถไฟท่าช้าง"
    ],
    "category": "TRANSPORT",
    "latitude": 7.012,
    "longitude": 100.415,
    "subdistrict": "ท่าช้าง / ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "รอยต่อเขตควนลัง-บางกล่ำ"
  },
  {
    "id": "lm-transport-56",
    "name": "สถานีรถไฟอู่ตะเภา (จุดหยุดรถอู่ตะเภา)",
    "aliases": [
      "สถานีอู่ตะเภา",
      "จุดหยุดรถอู่ตะเภา"
    ],
    "category": "TRANSPORT",
    "latitude": 7.0245,
    "longitude": 100.464,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใกล้สะพานดำคลองอู่ตะเภา ทางรถไฟสายหาดใหญ่-สุไหงโก-ลก"
  },
  {
    "id": "lm-transport-57",
    "name": "สถานีรถไฟวัดควนมีด (รอยต่อพะตง-จะนะ)",
    "aliases": [
      "สถานีรถไฟนาม่วง",
      "รถไฟน้ำน้อย"
    ],
    "category": "TRANSPORT",
    "latitude": 7.075,
    "longitude": 100.521,
    "subdistrict": "น้ำน้อย",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "แนวเส้นทางรถไฟเก่าหาดใหญ่-สงขลา"
  },
  {
    "id": "lm-university-58",
    "name": "มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่",
    "aliases": [
      "ม.อ.",
      "มอ.หาดใหญ่",
      "สงขลานครินทร์",
      "ประตู 108",
      "ประตู 109"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0065,
    "longitude": 100.4985,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช มีอ่างเก็บน้ำ ม.อ. และศูนย์ประชุมนานาชาติ"
  },
  {
    "id": "lm-university-59",
    "name": "มหาวิทยาลัยหาดใหญ่",
    "aliases": [
      "ม.หาดใหญ่",
      "มหาลัยหาดใหญ่"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.9892,
    "longitude": 100.4495,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนพลพิชัย ใกล้คลอง ร.1 และหาดใหญ่ใน"
  },
  {
    "id": "lm-university-60",
    "name": "วิทยาลัยเทคนิคหาดใหญ่",
    "aliases": [
      "เทคนิคหาดใหญ่",
      "วท.หาดใหญ่"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0365,
    "longitude": 100.5015,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช เยื้องสวนสาธารณะหาดใหญ่"
  },
  {
    "id": "lm-university-61",
    "name": "โรงเรียนหาดใหญ่วิทยาลัย",
    "aliases": [
      "ญ.ว.",
      "ญว.",
      "โรงเรียน ญ.ว."
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0182,
    "longitude": 100.4735,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม ใกล้หอนาฬิกาและสนามจิระนคร"
  },
  {
    "id": "lm-university-62",
    "name": "โรงเรียนหาดใหญ่วิทยาลัยสมบูรณ์กุลกันยา",
    "aliases": [
      "ญ.ส.",
      "ญส.",
      "โรงเรียน ญ.ส."
    ],
    "category": "UNIVERSITY",
    "latitude": 7.011,
    "longitude": 100.4895,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม ซอย 10 ใกล้ รพ.กรุงเทพหาดใหญ่"
  },
  {
    "id": "lm-university-63",
    "name": "โรงเรียนหาดใหญ่วิทยาลัย 2",
    "aliases": [
      "ญ.ว.2",
      "ญว.2",
      "หาดใหญ่วิทยาลัย 2"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.9395,
    "longitude": 100.4615,
    "subdistrict": "บ้านพรุ",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ตำบลบ้านพรุ ใกล้สนามกีฬาเมืองหลักภาคใต้ (พรุค้างคาว)"
  },
  {
    "id": "lm-university-64",
    "name": "โรงเรียนแสงทองวิทยา",
    "aliases": [
      "แสงทอง",
      "รร.แสงทอง",
      "แสงทองวิทยา"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0025,
    "longitude": 100.4765,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนธรรมนูญวิถี ใจกลางเมืองหาดใหญ่"
  },
  {
    "id": "lm-university-65",
    "name": "โรงเรียนธิดานุเคราะห์",
    "aliases": [
      "ธิดา",
      "รร.ธิดา",
      "ธิดานุเคราะห์"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.004,
    "longitude": 100.4775,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนศุภสารรังสรรค์ ติดกับโรงเรียนแสงทองวิทยา"
  },
  {
    "id": "lm-university-66",
    "name": "โรงเรียนศรีสว่างวงศ์",
    "aliases": [
      "ศรีสว่างวงศ์",
      "รร.ศรีสว่างวงศ์"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.9985,
    "longitude": 100.4785,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนราษฎร์ยินดี (30 เมตร)"
  },
  {
    "id": "lm-university-67",
    "name": "โรงเรียนสุวรรณวงศ์",
    "aliases": [
      "สุวรรณวงศ์",
      "รร.สุวรรณวงศ์"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0068,
    "longitude": 100.4742,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านตลาดกิมหยง ถนนศุภสารรังสรรค์"
  },
  {
    "id": "lm-university-68",
    "name": "โรงเรียนกอบกาญจน์ศึกษามูลนิธิ",
    "aliases": [
      "กอบกาญจน์",
      "รร.กอบกาญจน์"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0245,
    "longitude": 100.4785,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนนิพัทธ์สงเคราะห์ 5 หลังแบงก์ชาติ"
  },
  {
    "id": "lm-university-69",
    "name": "โรงเรียนอุดมศึกษาพณิชยการ",
    "aliases": [
      "อุดมฯ",
      "พณิชยการหาดใหญ่",
      "อุดมศึกษาพณิชยการ"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0005,
    "longitude": 100.4832,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนจันทร์วิโรจน์ ใกล้คลองเตย"
  },
  {
    "id": "lm-university-70",
    "name": "โรงเรียนเทศบาล 1 (เอ็งเสียงสามัคคี)",
    "aliases": [
      "ท.1",
      "เอ็งเสียง",
      "รร.เอ็งเสียงสามัคคี"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0115,
    "longitude": 100.4755,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนศุภสารรังสรรค์ ใกล้เทศบาลนครหาดใหญ่"
  },
  {
    "id": "lm-university-71",
    "name": "โรงเรียนเทศบาล 2 (บ้านหาดใหญ่)",
    "aliases": [
      "ท.2",
      "รร.เทศบาล 2 บ้านหาดใหญ่"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.9975,
    "longitude": 100.4535,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านหาดใหญ่ใน"
  },
  {
    "id": "lm-university-72",
    "name": "โรงเรียนเทศบาล 3 (โศภนพิทยาคุณานุสรณ์)",
    "aliases": [
      "ท.3",
      "รร.โศภนฯ",
      "เทศบาล 3 คอหงส์"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0155,
    "longitude": 100.4865,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม"
  },
  {
    "id": "lm-university-73",
    "name": "โรงเรียนเทศบาล 4 (วัดคลองเรียน)",
    "aliases": [
      "ท.4",
      "รร.วัดคลองเรียน"
    ],
    "category": "UNIVERSITY",
    "latitude": 7.0012,
    "longitude": 100.4892,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใกล้วัดคลองเรียน ถนนศรีภูวนารถ"
  },
  {
    "id": "lm-university-74",
    "name": "โรงเรียนหาดใหญ่รัฐประชาสรรค์",
    "aliases": [
      "ญ.ร.ส.",
      "ญรส.",
      "รร.หาดใหญ่รัฐประชาสรรค์"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.952,
    "longitude": 100.4125,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนสายสนามบินหาดใหญ่ ตำบลควนลัง"
  },
  {
    "id": "lm-university-75",
    "name": "โรงเรียนพะตงประธานคีรีวัฒน์",
    "aliases": [
      "พ.ต.ค.",
      "พตค.",
      "รร.พะตงประธานคีรีวัฒน์"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.8965,
    "longitude": 100.478,
    "subdistrict": "พะตง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ตำบลพะตง ย่านทุ่งลุง"
  },
  {
    "id": "lm-university-76",
    "name": "โรงเรียนคลองหอยโข่ง",
    "aliases": [
      "รร.คลองหอยโข่ง",
      "มัธยมคลองหอยโข่ง"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.9025,
    "longitude": 100.382,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "โรงเรียนมัธยมประจำอำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-university-77",
    "name": "โรงเรียนวัดโคกม่วง",
    "aliases": [
      "รร.วัดโคกม่วง",
      "วัดโคกม่วง"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.9055,
    "longitude": 100.415,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "หมู่ที่ 8 ตำบลโคกม่วง ใกล้วัดโคกม่วง"
  },
  {
    "id": "lm-university-78",
    "name": "โรงเรียนบ้านทุ่งลาน",
    "aliases": [
      "รร.บ้านทุ่งลาน",
      "โรงเรียนทุ่งลาน"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.871,
    "longitude": 100.4355,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลทุ่งลาน อำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-university-79",
    "name": "โรงเรียนบ้านคลองหลา",
    "aliases": [
      "รร.บ้านคลองหลา",
      "โรงเรียนคลองหลา"
    ],
    "category": "UNIVERSITY",
    "latitude": 6.9525,
    "longitude": 100.388,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหลา อำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-mall-80",
    "name": "ตลาดกิมหยง",
    "aliases": [
      "กิมหยง",
      "ตลาดกิมหยง",
      "แยกกิมหยง"
    ],
    "category": "MALL",
    "latitude": 7.0072,
    "longitude": 100.4725,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ตลาดศูนย์กลางเมือง ถนนศุภสารรังสรรค์ตัดเพชรเกษม"
  },
  {
    "id": "lm-mall-81",
    "name": "ตลาดสดพลาซ่า (หอนาฬิกา)",
    "aliases": [
      "ตลาดพลาซ่า",
      "หอนาฬิกาหาดใหญ่",
      "ตลาดสดหาดใหญ่"
    ],
    "category": "MALL",
    "latitude": 7.0098,
    "longitude": 100.473,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ติดหอนาฬิกาหาดใหญ่ ถนนเพชรเกษม"
  },
  {
    "id": "lm-mall-82",
    "name": "เซ็นทรัลเฟสติวัล หาดใหญ่",
    "aliases": [
      "เซ็นทรัลเฟส",
      "เซ็นทรัลหาดใหญ่",
      "เซ็นเฟส"
    ],
    "category": "MALL",
    "latitude": 6.9918,
    "longitude": 100.4852,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช เยื้องแม็คโครหาดใหญ่"
  },
  {
    "id": "lm-mall-83",
    "name": "ศูนย์การค้าไดอาน่า คอมเพล็กซ์",
    "aliases": [
      "ไดอาน่า",
      "ห้างไดอาน่า",
      "แยกไดอาน่า"
    ],
    "category": "MALL",
    "latitude": 6.9982,
    "longitude": 100.4838,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนศรีภูวนารถ ตัดถนนราษฎร์ยินดี"
  },
  {
    "id": "lm-mall-84",
    "name": "ห้างสรรพสินค้าโอเดียน แฟชั่นมอลล์",
    "aliases": [
      "โอเดียน",
      "ห้างโอเดียน",
      "สาย 3"
    ],
    "category": "MALL",
    "latitude": 7.0032,
    "longitude": 100.4722,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านถนนนิพัทธ์อุทิศ 3 (สาย 3) และถนนเสน่หานุสรณ์"
  },
  {
    "id": "lm-mall-85",
    "name": "ตลาดนัดกรีนเวย์ (Greenway Night Market)",
    "aliases": [
      "กรีนเวย์",
      "ตลาดกรีนเวย์"
    ],
    "category": "MALL",
    "latitude": 6.9958,
    "longitude": 100.4895,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช ใกล้สี่แยกคลองเรียน"
  },
  {
    "id": "lm-mall-86",
    "name": "ตลาดอาเซียนไนท์บาซาร์ (เปิดท้ายขนส่ง)",
    "aliases": [
      "เปิดท้าย",
      "เปิดท้ายขนส่ง",
      "อาเซียนเทรด"
    ],
    "category": "MALL",
    "latitude": 6.993,
    "longitude": 100.483,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ติดสถานีขนส่งผู้โดยสารหาดใหญ่ ถนนโชติวิทยะกุล"
  },
  {
    "id": "lm-mall-87",
    "name": "บิ๊กซี ซูเปอร์เซ็นเตอร์ หาดใหญ่ (คลองแห)",
    "aliases": [
      "บิ๊กซีคลองแห",
      "บิ๊กซีลพบุรีราเมศวร์"
    ],
    "category": "MALL",
    "latitude": 7.0375,
    "longitude": 100.4675,
    "subdistrict": "คลองแห",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "แยกบิ๊กซีคลองแห ถนนลพบุรีราเมศวร์"
  },
  {
    "id": "lm-mall-88",
    "name": "บิ๊กซี เอ็กซ์ตร้า หาดใหญ่",
    "aliases": [
      "บิ๊กซีเอ็กซ์ตร้า",
      "คาร์ฟูร์เก่า",
      "บิ๊กซีเพชรเกษม"
    ],
    "category": "MALL",
    "latitude": 7.0118,
    "longitude": 100.4878,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม ใกล้ปากซอย รพ.กรุงเทพหาดใหญ่"
  },
  {
    "id": "lm-mall-89",
    "name": "โลตัส หาดใหญ่ 1 (หน้า ม.อ.)",
    "aliases": [
      "โลตัสมอ.",
      "โลตัสหน้ามอ."
    ],
    "category": "MALL",
    "latitude": 7.0055,
    "longitude": 100.4925,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช ตรงข้ามประตู 108 ม.อ."
  },
  {
    "id": "lm-mall-90",
    "name": "โลตัส หาดใหญ่ 2 (หาดใหญ่ใน)",
    "aliases": [
      "โลตัสหาดใหญ่ใน",
      "โลตัสควนลัง"
    ],
    "category": "MALL",
    "latitude": 6.9992,
    "longitude": 100.4485,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเพชรเกษม ใกล้สะพานคลอง ร.1 หาดใหญ่ใน"
  },
  {
    "id": "lm-mall-91",
    "name": "แม็คโคร หาดใหญ่",
    "aliases": [
      "แม็คโคร",
      "แม็คโครหาดใหญ่"
    ],
    "category": "MALL",
    "latitude": 6.9895,
    "longitude": 100.4865,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช เยื้องเซ็นทรัลเฟสติวัล"
  },
  {
    "id": "lm-mall-92",
    "name": "ตลาดสดคลองเตย",
    "aliases": [
      "ตลาดคลองเตย",
      "คลองเตยหาดใหญ่"
    ],
    "category": "MALL",
    "latitude": 7.0178,
    "longitude": 100.4912,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ริมถนนเพชรเกษม ข้างคลองเตย"
  },
  {
    "id": "lm-mall-93",
    "name": "ตลาดคลองเรียน",
    "aliases": [
      "ตลาดคลองเรียน",
      "สามแยกคลองเรียน"
    ],
    "category": "MALL",
    "latitude": 7.0018,
    "longitude": 100.4905,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนศรีภูวนารถ ใกล้ ม.อ."
  },
  {
    "id": "lm-mall-94",
    "name": "ตลาดเกาะเสือ",
    "aliases": [
      "ตลาดเกาะเสือ",
      "เกาะเสือ"
    ],
    "category": "MALL",
    "latitude": 7.0195,
    "longitude": 100.4792,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านถนนนิพัทธ์สงเคราะห์"
  },
  {
    "id": "lm-mall-95",
    "name": "ตลาดสดหาดใหญ่ใน",
    "aliases": [
      "ตลาดหาดใหญ่ใน",
      "คิวรถหาดใหญ่ใน"
    ],
    "category": "MALL",
    "latitude": 7.0022,
    "longitude": 100.453,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "เชิงสะพานท่าเคียน (สะพานหาดใหญ่ใน)"
  },
  {
    "id": "lm-mall-96",
    "name": "ตลาดน้ำคลองแห",
    "aliases": [
      "ตลาดน้ำคลองแห",
      "วัดคลองแห"
    ],
    "category": "MALL",
    "latitude": 7.0462,
    "longitude": 100.4748,
    "subdistrict": "คลองแห",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ริมคลองแห ข้างวัดคลองแห"
  },
  {
    "id": "lm-mall-97",
    "name": "ตลาดนัดบ้านพรุ",
    "aliases": [
      "ตลาดบ้านพรุ",
      "ตลาดสดบ้านพรุ"
    ],
    "category": "MALL",
    "latitude": 6.9432,
    "longitude": 100.469,
    "subdistrict": "บ้านพรุ",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "เขตเทศบาลเมืองบ้านพรุ"
  },
  {
    "id": "lm-mall-98",
    "name": "ตลาดสดทุ่งลุง",
    "aliases": [
      "ตลาดทุ่งลุง",
      "ย่านทุ่งลุง"
    ],
    "category": "MALL",
    "latitude": 6.8925,
    "longitude": 100.4745,
    "subdistrict": "พะตง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช ตำบลพะตง"
  },
  {
    "id": "lm-mall-99",
    "name": "ตลาดนัดโคกม่วง",
    "aliases": [
      "ตลาดโคกม่วง",
      "แยกโคกม่วง"
    ],
    "category": "MALL",
    "latitude": 6.9018,
    "longitude": 100.4165,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "จุดศูนย์รวมการค้าตำบลโคกม่วง อำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-mall-100",
    "name": "ตลาดคลองหอยโข่ง",
    "aliases": [
      "ตลาดสดคลองหอยโข่ง",
      "ตลาดอำเภอคลองหอยโข่ง"
    ],
    "category": "MALL",
    "latitude": 6.8995,
    "longitude": 100.3875,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ใกล้ที่ว่าการอำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-flood_risk-101",
    "name": "สะพานท่าเคียน (สะพานหาดใหญ่ใน)",
    "aliases": [
      "สะพานหาดใหญ่ใน",
      "ท่าหาดใหญ่ใน",
      "คลองอู่ตะเภาหาดใหญ่ใน"
    ],
    "category": "FLOOD_RISK",
    "latitude": 7.0025,
    "longitude": 100.4545,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดวิกฤตน้ำคลองอู่ตะเภาล้นตลิ่งเข้าท่วมหาดใหญ่ในและตัวเมือง"
  },
  {
    "id": "lm-flood_risk-102",
    "name": "สะพานคลองระบายน้ำที่ 1 (เพชรเกษม-ควนลัง)",
    "aliases": [
      "สะพานคลอง ร.1",
      "คลอง ร.1 หาดใหญ่ใน",
      "คลองร.1 โลตัส"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.999,
    "longitude": 100.4468,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดผันน้ำหลักข้างโลตัสหาดใหญ่ใน และ บขส.ตลาดเกษตร"
  },
  {
    "id": "lm-flood_risk-103",
    "name": "สะพานดำคลองอู่ตะเภา (ทางรถไฟ)",
    "aliases": [
      "สะพานดำ",
      "สะพานรถไฟอู่ตะเภา",
      "ชุมชนสถานีอู่ตะเภา"
    ],
    "category": "FLOOD_RISK",
    "latitude": 7.0255,
    "longitude": 100.4632,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดรวมน้ำคลองอู่ตะเภาและคลองเตย พื้นที่ลุ่มต่ำน้ำท่วมสูง"
  },
  {
    "id": "lm-flood_risk-104",
    "name": "อุโมงค์ลอดทางรถไฟถนนศรีภูวนารถ",
    "aliases": [
      "อุโมงค์ศรีภูวนารถ",
      "สะพานลอดรถไฟศรีภูวนารถ"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.998,
    "longitude": 100.4685,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดน้ำท่วมขังสูงจุดแรกเมื่อฝนตกหนัก รถเล็กสัญจรไม่ได้"
  },
  {
    "id": "lm-flood_risk-105",
    "name": "แยกคลองหวะ (สะพานคลองหวะ)",
    "aliases": [
      "แยกคลองหวะ",
      "คลองหวะ",
      "บ้านคลองหวะ"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.9765,
    "longitude": 100.4795,
    "subdistrict": "คอหงส์ / บ้านพรุ",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดรับน้ำจากบ้านพรุและพะตง ก่อนไหลเข้าสู่เมืองหาดใหญ่"
  },
  {
    "id": "lm-flood_risk-106",
    "name": "ชุมชนบ้านเกาะหมี (ริมคลองอู่ตะเภา-คลองแห)",
    "aliases": [
      "เกาะหมี",
      "บ้านเกาะหมี",
      "สะพานเกาะหมี"
    ],
    "category": "FLOOD_RISK",
    "latitude": 7.05,
    "longitude": 100.4734,
    "subdistrict": "คลองแห",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "พื้นที่รับน้ำปลายคลองอู่ตะเภาและคลองแห น้ำท่วมขังสูงซ้ำซาก"
  },
  {
    "id": "lm-flood_risk-107",
    "name": "ชุมชนคลองเตย (แนวคลองเตย-เพชรเกษม)",
    "aliases": [
      "คลองเตย",
      "ริมคลองเตย",
      "สะพานคลองเตย"
    ],
    "category": "FLOOD_RISK",
    "latitude": 7.0165,
    "longitude": 100.489,
    "subdistrict": "คอหงส์ / หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ลำคลองสายหลักที่ระบายน้ำจากเขาคอหงส์ผ่านกลางเมือง"
  },
  {
    "id": "lm-flood_risk-108",
    "name": "อ่างเก็บน้ำแก้มลิงคลองเรียน",
    "aliases": [
      "แก้มลิงคลองเรียน",
      "คลองเรียน",
      "ต้นคลองเรียน"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.995,
    "longitude": 100.502,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดชะลอน้ำจากเขาคอหงส์และ ม.อ. ก่อนเข้าย่านศรีภูวนารถ-30 เมตร"
  },
  {
    "id": "lm-flood_risk-109",
    "name": "ถนนราษฎร์ยินดี (ถนน 30 เมตร)",
    "aliases": [
      "ถนน 30 เมตร",
      "สามสิบเมตร",
      "เหล็กใต้ 30 เมตร"
    ],
    "category": "FLOOD_RISK",
    "latitude": 7.001,
    "longitude": 100.48,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "แนวรับน้ำจากคลองเรียนและคลองเตย"
  },
  {
    "id": "lm-flood_risk-110",
    "name": "สถานีวัดน้ำสะพานบ้านม่วงก๊อง",
    "aliases": [
      "สะพานม่วงก๊อง",
      "บ้านม่วงก๊อง",
      "คลองอู่ตะเภาม่วงก๊อง"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.8855,
    "longitude": 100.451,
    "subdistrict": "พะตง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดเฝ้าระวังระดับน้ำคลองอู่ตะเภาตอนบน ก่อนเข้าเขตบ้านพรุ-หาดใหญ่"
  },
  {
    "id": "lm-flood_risk-111",
    "name": "สถานีวัดน้ำสะพานบ้านบางศาลา",
    "aliases": [
      "สะพานบางศาลา",
      "บ้านบางศาลา",
      "คลองอู่ตะเภาบางศาลา"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.928,
    "longitude": 100.454,
    "subdistrict": "บ้านพรุ",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดเช็กระดับน้ำคลองอู่ตะเภา ช่วงตำบลบ้านพรุ"
  },
  {
    "id": "lm-flood_risk-112",
    "name": "ชุมชนบ้านบางหัก (ริมคลองอู่ตะเภา-คลอง ร.1)",
    "aliases": [
      "บางหัก",
      "บ้านบางหัก",
      "ปากคลอง ร.1"
    ],
    "category": "FLOOD_RISK",
    "latitude": 7.068,
    "longitude": 100.452,
    "subdistrict": "คลองอู่ตะเภา / คูเต่า",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดบรรจบน้ำก่อนลงสู่ทะเลสาบสงขลา ท่วมลึกต้องใช้เรือท้องแบน"
  },
  {
    "id": "lm-flood_risk-113",
    "name": "บ้านคูเต่า (ปลายคลองอู่ตะเภา-คลอง ร.1)",
    "aliases": [
      "คูเต่า",
      "บ้านคูเต่า",
      "ปากคลองอู่ตะเภา"
    ],
    "category": "FLOOD_RISK",
    "latitude": 7.0965,
    "longitude": 100.4495,
    "subdistrict": "คูเต่า",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "พื้นที่ท้ายน้ำติดทะเลสาบสงขลา น้ำท่วมขังยาวนาน"
  },
  {
    "id": "lm-flood_risk-114",
    "name": "บ้านหน้าควน - คลองต่ำ (ควนลัง)",
    "aliases": [
      "หน้าควน",
      "คลองต่ำ",
      "สะพานคลองต่ำ"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.982,
    "longitude": 100.438,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดรับน้ำจากคลองหอยโข่งและคลองหลาไหลลงคลอง ร.1"
  },
  {
    "id": "lm-flood_risk-115",
    "name": "บ้านปลักธง - ควนจง (แนวคลองหวะ-คอหงส์)",
    "aliases": [
      "ปลักธง",
      "ควนจง",
      "บ้านปลักธง"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.972,
    "longitude": 100.491,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "พื้นที่เสี่ยงน้ำป่าไหลหลากและน้ำคลองหวะเอ่อล้น"
  },
  {
    "id": "lm-flood_risk-116",
    "name": "บ้านกลาง - หูแร่ - นาแสน (ตำบลทุ่งตำเสา)",
    "aliases": [
      "หูแร่",
      "บ้านกลาง",
      "นาแสน",
      "คลองจำไหร"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.965,
    "longitude": 100.382,
    "subdistrict": "ทุ่งตำเสา",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "พื้นที่รับน้ำจากเทือกเขาแก้ว (โตนงาช้าง) ก่อนลงคลองหลา-คลอง ร.1"
  },
  {
    "id": "lm-flood_risk-117",
    "name": "อ่างเก็บน้ำคลองหลา",
    "aliases": [
      "อ่างเก็บน้ำคลองหลา",
      "เขื่อนคลองหลา",
      "สปิลเวย์คลองหลา"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.942,
    "longitude": 100.355,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "อ่างเก็บน้ำหลักใน อ.คลองหอยโข่ง ที่ระบายลงคลองหลาและคลอง ร.1"
  },
  {
    "id": "lm-flood_risk-118",
    "name": "ประตูระบายน้ำคลองหลา (บ้านสะพานหมาก)",
    "aliases": [
      "ประตูน้ำคลองหลา",
      "บ้านสะพานหมาก",
      "คลองหลา"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.9535,
    "longitude": 100.391,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "จุดเสี่ยงน้ำล้นตลิ่งเข้าท่วม ต.คลองหลา และรันเวย์สนามบินหาดใหญ่"
  },
  {
    "id": "lm-flood_risk-119",
    "name": "ลุ่มน้ำคลองหอยโข่ง (บ้านเหนือ - บ้านจอมหรำ)",
    "aliases": [
      "คลองหอยโข่ง",
      "สะพานบ้านเหนือ",
      "สะพานจอมหรำ"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.901,
    "longitude": 100.379,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "จุดน้ำล้นตลิ่งคลองหอยโข่ง ท่วมพื้นที่การเกษตรและบ้านเรือนริมคลอง"
  },
  {
    "id": "lm-flood_risk-120",
    "name": "บ้านพรุเตาะ - บ้านทุ่งโชน (แนวคลองต่ำ-โคกม่วง)",
    "aliases": [
      "พรุเตาะ",
      "ทุ่งโชน",
      "คลองพรุเตาะ"
    ],
    "category": "FLOOD_RISK",
    "latitude": 6.912,
    "longitude": 100.425,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "พื้นที่ลุ่มต่ำรับน้ำในตำบลโคกม่วง อำเภอคลองหอยโข่ง"
  },
  {
    "id": "lm-community-121",
    "name": "ย่านเขต 8 (ถนนราษฎร์อุทิศ)",
    "aliases": [
      "เขต 8",
      "เขตแปด",
      "ถนนราษฎร์อุทิศ",
      "ซอยเขต 8"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0085,
    "longitude": 100.4595,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านชุมชนและร้านอาหารหนาแน่น ฝั่งตะวันตกของทางรถไฟ น้ำท่วมขังบ่อย"
  },
  {
    "id": "lm-community-122",
    "name": "ชุมชนโชคสมาน (ซอยโชคสมาน 1-5)",
    "aliases": [
      "โชคสมาน",
      "โชคสมาน 5",
      "วัดโคกสมานคุณ",
      "สะพานโคกสมาน"
    ],
    "category": "COMMUNITY",
    "latitude": 7.002,
    "longitude": 100.4615,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใกล้วัดโคกสมานคุณ อยู่ระหว่างทางรถไฟและเขต 8"
  },
  {
    "id": "lm-community-123",
    "name": "ชุมชนทุ่งเสา (ถนนทุ่งเสา 1 และ 2)",
    "aliases": [
      "ทุ่งเสา",
      "ทุ่งเสา 1",
      "ทุ่งเสา 2",
      "ซอยทุ่งเสา"
    ],
    "category": "COMMUNITY",
    "latitude": 6.9935,
    "longitude": 100.4765,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใกล้สถานีขนส่งและถนนราษฎร์ยินดี"
  },
  {
    "id": "lm-community-124",
    "name": "ชุมชนจันทร์วิโรจน์",
    "aliases": [
      "จันทร์วิโรจน์",
      "ซอยจันทร์วิโรจน์"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0015,
    "longitude": 100.4835,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "พื้นที่ลุ่มต่ำใกล้คลองเตยและ รร.อุดมศึกษาพณิชยการ"
  },
  {
    "id": "lm-community-125",
    "name": "ชุมชนจันทร์ประทีป",
    "aliases": [
      "จันทร์ประทีป",
      "ซอยจันทร์ประทีป"
    ],
    "category": "COMMUNITY",
    "latitude": 6.9995,
    "longitude": 100.482,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "อยู่ใกล้ถนนราษฎร์ยินดี (30 เมตร) และจันทร์วิโรจน์"
  },
  {
    "id": "lm-community-126",
    "name": "ชุมชนจันทร์นิเวศน์",
    "aliases": [
      "จันทร์นิเวศน์",
      "ถนนจันทร์นิเวศน์"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0005,
    "longitude": 100.485,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "จุดเฝ้าระวังน้ำท่วมขังแนวคลองเรียน-คลองเตย"
  },
  {
    "id": "lm-community-127",
    "name": "ชุมชนรัตนวิบูลย์",
    "aliases": [
      "รัตนวิบูลย์",
      "ซอยรัตนวิบูลย์"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0025,
    "longitude": 100.486,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ติดแนวคลองเตย ใกล้ถนนศรีภูวนารถ"
  },
  {
    "id": "lm-community-128",
    "name": "ย่านฉื่อฉาง (ถนนศุภสารรังสรรค์)",
    "aliases": [
      "ฉื่อฉาง",
      "วัดฉื่อฉาง",
      "ถนนศุภสารรังสรรค์"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0065,
    "longitude": 100.4755,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านการค้าเก่าแก่ ใกล้มูลนิธิท่งเซียเซี่ยงตึ๊ง"
  },
  {
    "id": "lm-community-129",
    "name": "ถนนนิพัทธ์อุทิศ 1, 2, 3 (สาย 1, สาย 2, สาย 3)",
    "aliases": [
      "สาย 1",
      "สาย 2",
      "สาย 3",
      "นิพัทธ์อุทิศ"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0045,
    "longitude": 100.471,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านเศรษฐกิจใจกลางเมืองหาดใหญ่ ใกล้สถานีรถไฟและกิมหยง"
  },
  {
    "id": "lm-community-130",
    "name": "ชุมชนบ้านทุ่งรี (ซอยทุ่งรี 1-17)",
    "aliases": [
      "ทุ่งรี",
      "บ้านทุ่งรี",
      "ซอยทุ่งรี",
      "ทุ่งรี ม.อ."
    ],
    "category": "COMMUNITY",
    "latitude": 7.0035,
    "longitude": 100.5032,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านหอพักนักศึกษา ข้าง ม.อ. ประตู 109"
  },
  {
    "id": "lm-community-131",
    "name": "ชุมชนถนนปุณณกัณฑ์ (หลัง ม.อ.)",
    "aliases": [
      "ปุณณกัณฑ์",
      "ถนนปุณณกัณฑ์",
      "ประตู 109 ม.อ.",
      "บ้านในไร่"
    ],
    "category": "COMMUNITY",
    "latitude": 6.9985,
    "longitude": 100.5055,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนเลียบข้าง ม.อ. มุ่งหน้าทุ่งหวัง-สงขลา"
  },
  {
    "id": "lm-community-132",
    "name": "ชุมชนคลองเรียน 1 และ 2",
    "aliases": [
      "คลองเรียน 1",
      "คลองเรียน 2",
      "ซอยคลองเรียน"
    ],
    "category": "COMMUNITY",
    "latitude": 6.999,
    "longitude": 100.4915,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านที่พักอาศัยระหว่าง ม.อ. กับถนน 30 เมตร"
  },
  {
    "id": "lm-community-133",
    "name": "ชุมชนภาสว่าง",
    "aliases": [
      "ภาสว่าง",
      "ซอยภาสว่าง",
      "เพชรเกษมซอย 10"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0145,
    "longitude": 100.4895,
    "subdistrict": "คอหงส์ / หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "เชื่อมถนนเพชรเกษมและถนนกาญจนวนิช"
  },
  {
    "id": "lm-community-134",
    "name": "ชุมชนทักษิณเมืองทอง",
    "aliases": [
      "ทักษิณเมืองทอง",
      "หมู่บ้านทักษิณเมืองทอง"
    ],
    "category": "COMMUNITY",
    "latitude": 7.024,
    "longitude": 100.495,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช ใกล้ค่ายเสนาณรงค์"
  },
  {
    "id": "lm-community-135",
    "name": "ชุมชนหน้าสวนสาธารณะเทศบาลนครหาดใหญ่",
    "aliases": [
      "หน้าสวนฯ",
      "สวนสาธารณะหาดใหญ่",
      "เขาคอหงส์"
    ],
    "category": "COMMUNITY",
    "latitude": 7.039,
    "longitude": 100.505,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนกาญจนวนิช ทางขึ้นพระพุทธมงคลมหาราช เขาคอหงส์"
  },
  {
    "id": "lm-community-136",
    "name": "ชุมชนศาลาลุงทอง - แฟลตเคหะหาดใหญ่",
    "aliases": [
      "แฟลตเคหะ",
      "เคหะหาดใหญ่",
      "ศาลาลุงทอง"
    ],
    "category": "COMMUNITY",
    "latitude": 6.9945,
    "longitude": 100.465,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านที่พักอาศัยหนาแน่น ใกล้ทางรถไฟสายใต้"
  },
  {
    "id": "lm-community-137",
    "name": "ชุมชนสัจจกุล - ท่าไทร",
    "aliases": [
      "สัจจกุล",
      "ถนนสัจจกุล",
      "ชุมชนท่าไทร"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0155,
    "longitude": 100.4625,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "อยู่ระหว่างถนนรัถการกับถนนราษฎร์อุทิศ (เขต 8)"
  },
  {
    "id": "lm-community-138",
    "name": "ชุมชนป้อม 4 และ ป้อม 6 (ริมทางรถไฟ)",
    "aliases": [
      "ป้อม 4",
      "ป้อม 6",
      "ชุมชนริมทางรถไฟ"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0195,
    "longitude": 100.466,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "แนวชุมชนขนานทางรถไฟ ใกล้ รพ.หาดใหญ่"
  },
  {
    "id": "lm-community-139",
    "name": "ชุมชนสนามกีฬากลางจิระนคร",
    "aliases": [
      "สนามจิระนคร",
      "หน้าสนามกีฬา",
      "หลังสนามกีฬา"
    ],
    "category": "COMMUNITY",
    "latitude": 7.019,
    "longitude": 100.4715,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ถนนนิพัทธ์สงเคราะห์ 1 ใกล้ รร.ญ.ว. และ รพ.ศิครินทร์"
  },
  {
    "id": "lm-community-140",
    "name": "ชุมชนบ้านหาดใหญ่ใน - ท่าเคียน",
    "aliases": [
      "หาดใหญ่ใน",
      "บ้านหาดใหญ่ใน",
      "วัดหาดใหญ่ใน"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0018,
    "longitude": 100.4525,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ใกล้วัดมหัตตมังคลาราม (วัดหาดใหญ่ใน) ริมคลองอู่ตะเภา"
  },
  {
    "id": "lm-community-141",
    "name": "ชุมชนคลองแห - อัมพวัน",
    "aliases": [
      "คลองแห",
      "ชุมชนคลองแห",
      "บ้านอัมพวัน"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0425,
    "longitude": 100.4745,
    "subdistrict": "คลองแห",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านชุมชนรอบวัดคลองแหและถนนลพบุรีราเมศวร์"
  },
  {
    "id": "lm-community-142",
    "name": "ชุมชนบ้านปลักหว้า - ควนสันติ (ควนลัง)",
    "aliases": [
      "ปลักหว้า",
      "ควนสันติ",
      "บ้านแม่ลัง"
    ],
    "category": "COMMUNITY",
    "latitude": 6.9785,
    "longitude": 100.422,
    "subdistrict": "ควนลัง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ชุมชนขนาดใหญ่ในเขตเทศบาลเมืองควนลัง"
  },
  {
    "id": "lm-community-143",
    "name": "ชุมชนพรุค้างคาว - บ้านพรุ",
    "aliases": [
      "พรุค้างคาว",
      "สนามกีฬาพรุค้างคาว",
      "บ้านพรุ"
    ],
    "category": "COMMUNITY",
    "latitude": 6.938,
    "longitude": 100.463,
    "subdistrict": "บ้านพรุ",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "รอบสนามกีฬาเมืองหลักภาคใต้ ตำบลบ้านพรุ"
  },
  {
    "id": "lm-community-144",
    "name": "ชุมชนทุ่งลุง - สวนมะพร้าว (พะตง)",
    "aliases": [
      "ทุ่งลุง",
      "ชุมชนสวนมะพร้าว",
      "ย่านยาวออก"
    ],
    "category": "COMMUNITY",
    "latitude": 6.891,
    "longitude": 100.475,
    "subdistrict": "พะตง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ชุมชนเขตเทศบาลตำบลพะตง"
  },
  {
    "id": "lm-community-145",
    "name": "ชุมชนบ้านน้ำน้อย",
    "aliases": [
      "บ้านน้ำน้อย",
      "ตลาดน้ำน้อย",
      "วัดน้ำน้อย"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0795,
    "longitude": 100.525,
    "subdistrict": "น้ำน้อย",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ริมถนนกาญจนวนิช สายหาดใหญ่-สงขลา"
  },
  {
    "id": "lm-community-146",
    "name": "ชุมชนบ้านท่าข้าม",
    "aliases": [
      "บ้านท่าข้าม",
      "ตำบลท่าข้าม"
    ],
    "category": "COMMUNITY",
    "latitude": 7.056,
    "longitude": 100.539,
    "subdistrict": "ท่าข้าม",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ตำบลท่าข้าม อำเภอหาดใหญ่"
  },
  {
    "id": "lm-community-147",
    "name": "ชุมชนบ้านทุ่งใหญ่",
    "aliases": [
      "บ้านทุ่งใหญ่",
      "ตำบลทุ่งใหญ่"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0465,
    "longitude": 100.518,
    "subdistrict": "ทุ่งใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ตำบลทุ่งใหญ่ พื้นที่รอยต่อคอหงส์-ท่าข้าม"
  },
  {
    "id": "lm-community-148",
    "name": "ชุมชนบ้านฉลุง",
    "aliases": [
      "บ้านฉลุง",
      "ตำบลฉลุง",
      "วัดฉลุง"
    ],
    "category": "COMMUNITY",
    "latitude": 7.014,
    "longitude": 100.368,
    "subdistrict": "ฉลุง",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ทิศตะวันตกของอำเภอหาดใหญ่ ติดเขตอำเภอรัตภูมิ"
  },
  {
    "id": "lm-community-149",
    "name": "บ้านจอมหรำ (หมู่ที่ 1 ต.คลองหอยโข่ง)",
    "aliases": [
      "บ้านจอมหรำ",
      "หมู่ 1 คลองหอยโข่ง",
      "จอมหรำ"
    ],
    "category": "COMMUNITY",
    "latitude": 6.905,
    "longitude": 100.3765,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ริมคลองหอยโข่ง ใกล้ตัวอำเภอ"
  },
  {
    "id": "lm-community-150",
    "name": "บ้านดานงา (หมู่ที่ 2 ต.คลองหอยโข่ง)",
    "aliases": [
      "บ้านดานงา",
      "หมู่ 2 คลองหอยโข่ง",
      "ดานงา"
    ],
    "category": "COMMUNITY",
    "latitude": 6.911,
    "longitude": 100.371,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหอยโข่ง"
  },
  {
    "id": "lm-community-151",
    "name": "บ้านเหนือ (หมู่ที่ 3 ต.คลองหอยโข่ง)",
    "aliases": [
      "บ้านเหนือ",
      "บ้านเหนือคลองหอยโข่ง",
      "หมู่ 3 คลองหอยโข่ง"
    ],
    "category": "COMMUNITY",
    "latitude": 6.8985,
    "longitude": 100.386,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ที่ตั้งที่ว่าการอำเภอคลองหอยโข่งและค่ายรัตนพล"
  },
  {
    "id": "lm-community-152",
    "name": "บ้านยูงทอง (หมู่ที่ 4 ต.คลองหอยโข่ง)",
    "aliases": [
      "บ้านยูงทอง",
      "หมู่ 4 คลองหอยโข่ง",
      "ยูงทอง"
    ],
    "category": "COMMUNITY",
    "latitude": 6.889,
    "longitude": 100.381,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหอยโข่ง"
  },
  {
    "id": "lm-community-153",
    "name": "บ้านทุ่งเลียบ (หมู่ที่ 5 ต.คลองหอยโข่ง)",
    "aliases": [
      "บ้านทุ่งเลียบ",
      "หมู่ 5 คลองหอยโข่ง",
      "ทุ่งเลียบ"
    ],
    "category": "COMMUNITY",
    "latitude": 6.8835,
    "longitude": 100.3925,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ใกล้สถานีรถไฟคลองหอยโข่ง"
  },
  {
    "id": "lm-community-154",
    "name": "บ้านเก่าร้าง (หมู่ที่ 6 ต.คลองหอยโข่ง)",
    "aliases": [
      "บ้านเก่าร้าง",
      "หมู่ 6 คลองหอยโข่ง",
      "เก่าร้าง"
    ],
    "category": "COMMUNITY",
    "latitude": 6.878,
    "longitude": 100.369,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหอยโข่ง มีจุดชมวิวเขาวังชิง"
  },
  {
    "id": "lm-community-155",
    "name": "บ้านควนกบ (หมู่ที่ 7 ต.คลองหอยโข่ง)",
    "aliases": [
      "บ้านควนกบ",
      "หมู่ 7 คลองหอยโข่ง",
      "ควนกบ"
    ],
    "category": "COMMUNITY",
    "latitude": 6.892,
    "longitude": 100.364,
    "subdistrict": "คลองหอยโข่ง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหอยโข่ง"
  },
  {
    "id": "lm-community-156",
    "name": "บ้านโคกเหรียง (หมู่ที่ 1 ต.โคกม่วง)",
    "aliases": [
      "บ้านโคกเหรียง",
      "หมู่ 1 โคกม่วง",
      "โคกเหรียง"
    ],
    "category": "COMMUNITY",
    "latitude": 6.915,
    "longitude": 100.408,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลโคกม่วง"
  },
  {
    "id": "lm-community-157",
    "name": "บ้านทุ่งนนท์ (หมู่ที่ 2 ต.โคกม่วง)",
    "aliases": [
      "บ้านทุ่งนนท์",
      "หมู่ 2 โคกม่วง",
      "ทุ่งนนท์"
    ],
    "category": "COMMUNITY",
    "latitude": 6.9185,
    "longitude": 100.415,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลโคกม่วง"
  },
  {
    "id": "lm-community-158",
    "name": "บ้านโคกสักตก (หมู่ที่ 3 ต.โคกม่วง)",
    "aliases": [
      "บ้านโคกสักตก",
      "หมู่ 3 โคกม่วง",
      "โคกสักตก"
    ],
    "category": "COMMUNITY",
    "latitude": 6.895,
    "longitude": 100.405,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลโคกม่วง"
  },
  {
    "id": "lm-community-159",
    "name": "บ้านโคกสัก (หมู่ที่ 4 ต.โคกม่วง)",
    "aliases": [
      "บ้านโคกสัก",
      "หมู่ 4 โคกม่วง",
      "โคกสัก"
    ],
    "category": "COMMUNITY",
    "latitude": 6.894,
    "longitude": 100.413,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลโคกม่วง"
  },
  {
    "id": "lm-community-160",
    "name": "บ้านปลักคล้า (หมู่ที่ 5 ต.โคกม่วง)",
    "aliases": [
      "บ้านปลักคล้า",
      "หมู่ 5 โคกม่วง",
      "ปลักคล้า"
    ],
    "category": "COMMUNITY",
    "latitude": 6.908,
    "longitude": 100.422,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลโคกม่วง"
  },
  {
    "id": "lm-community-161",
    "name": "บ้านพรุเตาะ (หมู่ที่ 6 ต.โคกม่วง)",
    "aliases": [
      "บ้านพรุเตาะ",
      "หมู่ 6 โคกม่วง",
      "พรุเตาะ"
    ],
    "category": "COMMUNITY",
    "latitude": 6.9125,
    "longitude": 100.4265,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "พื้นที่ลุ่มต่ำใกล้แนวคลองระบายน้ำ"
  },
  {
    "id": "lm-community-162",
    "name": "บ้านทุ่งโชน (หมู่ที่ 7 ต.โคกม่วง)",
    "aliases": [
      "บ้านทุ่งโชน",
      "หมู่ 7 โคกม่วง",
      "ทุ่งโชน"
    ],
    "category": "COMMUNITY",
    "latitude": 6.9015,
    "longitude": 100.418,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ที่ตั้งสำนักงานเทศบาลตำบลโคกม่วง"
  },
  {
    "id": "lm-community-163",
    "name": "บ้านโคกม่วง / บ้านพักกองบิน 56 (หมู่ที่ 8 ต.โคกม่วง)",
    "aliases": [
      "บ้านโคกม่วง",
      "หมู่ 8 โคกม่วง",
      "บ้านพักกองบิน 56"
    ],
    "category": "COMMUNITY",
    "latitude": 6.925,
    "longitude": 100.402,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ครอบคลุมพื้นที่บ้านพักกองบิน 56 และวัดโคกม่วง"
  },
  {
    "id": "lm-community-164",
    "name": "บ้านทอนคลอง (หมู่ที่ 9 ต.โคกม่วง)",
    "aliases": [
      "บ้านทอนคลอง",
      "หมู่ 9 โคกม่วง",
      "ทอนคลอง"
    ],
    "category": "COMMUNITY",
    "latitude": 6.8895,
    "longitude": 100.419,
    "subdistrict": "โคกม่วง",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลโคกม่วง"
  },
  {
    "id": "lm-community-165",
    "name": "บ้านย่านยาว (หมู่ที่ 1 ต.ทุ่งลาน)",
    "aliases": [
      "บ้านย่านยาว",
      "หมู่ 1 ทุ่งลาน",
      "ย่านยาวทุ่งลาน"
    ],
    "category": "COMMUNITY",
    "latitude": 6.878,
    "longitude": 100.445,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "รอยต่อตำบลพะตง (ทุ่งลุง)"
  },
  {
    "id": "lm-community-166",
    "name": "บ้านทุ่งแม่บัว (หมู่ที่ 2 ต.ทุ่งลาน)",
    "aliases": [
      "บ้านทุ่งแม่บัว",
      "หมู่ 2 ทุ่งลาน",
      "ทุ่งแม่บัว"
    ],
    "category": "COMMUNITY",
    "latitude": 6.872,
    "longitude": 100.432,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลทุ่งลาน"
  },
  {
    "id": "lm-community-167",
    "name": "บ้านพร้าว (หมู่ที่ 3 ต.ทุ่งลาน)",
    "aliases": [
      "บ้านพร้าว",
      "หมู่ 3 ทุ่งลาน",
      "บ้านพร้าวทุ่งลาน"
    ],
    "category": "COMMUNITY",
    "latitude": 6.866,
    "longitude": 100.437,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลทุ่งลาน"
  },
  {
    "id": "lm-community-168",
    "name": "บ้านควน (หมู่ที่ 4 ต.ทุ่งลาน)",
    "aliases": [
      "บ้านควน",
      "หมู่ 4 ทุ่งลาน",
      "บ้านควนทุ่งลาน"
    ],
    "category": "COMMUNITY",
    "latitude": 6.861,
    "longitude": 100.429,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลทุ่งลาน"
  },
  {
    "id": "lm-community-169",
    "name": "บ้านโคกพยอม (หมู่ที่ 5 ต.ทุ่งลาน)",
    "aliases": [
      "บ้านโคกพยอม",
      "หมู่ 5 ทุ่งลาน",
      "โคกพยอม"
    ],
    "category": "COMMUNITY",
    "latitude": 6.858,
    "longitude": 100.441,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลทุ่งลาน"
  },
  {
    "id": "lm-community-170",
    "name": "บ้านคลองบ่อ (หมู่ที่ 6 ต.ทุ่งลาน)",
    "aliases": [
      "บ้านคลองบ่อ",
      "หมู่ 6 ทุ่งลาน",
      "คลองบ่อ"
    ],
    "category": "COMMUNITY",
    "latitude": 6.852,
    "longitude": 100.435,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลทุ่งลาน"
  },
  {
    "id": "lm-community-171",
    "name": "บ้านท่าหรั่ง (หมู่ที่ 7 ต.ทุ่งลาน)",
    "aliases": [
      "บ้านท่าหรั่ง",
      "หมู่ 7 ทุ่งลาน",
      "ท่าหรั่ง"
    ],
    "category": "COMMUNITY",
    "latitude": 6.864,
    "longitude": 100.448,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ริมคลองอู่ตะเภาตอนบน รอยต่อ ต.พะตง"
  },
  {
    "id": "lm-community-172",
    "name": "บ้านแม่คล้า (หมู่ที่ 8 ต.ทุ่งลาน)",
    "aliases": [
      "บ้านแม่คล้า",
      "หมู่ 8 ทุ่งลาน",
      "แม่คล้า"
    ],
    "category": "COMMUNITY",
    "latitude": 6.875,
    "longitude": 100.425,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "เขตเทศบาลตำบลทุ่งลาน"
  },
  {
    "id": "lm-community-173",
    "name": "บ้านมะพร้าวออก (หมู่ที่ 9 ต.ทุ่งลาน)",
    "aliases": [
      "บ้านมะพร้าวออก",
      "หมู่ 9 ทุ่งลาน",
      "มะพร้าวออก"
    ],
    "category": "COMMUNITY",
    "latitude": 6.8675,
    "longitude": 100.439,
    "subdistrict": "ทุ่งลาน",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ที่ตั้งสำนักงานเทศบาลตำบลทุ่งลาน"
  },
  {
    "id": "lm-community-174",
    "name": "บ้านสะพานหมาก (หมู่ที่ 1 ต.คลองหลา)",
    "aliases": [
      "บ้านสะพานหมาก",
      "หมู่ 1 คลองหลา",
      "สะพานหมาก"
    ],
    "category": "COMMUNITY",
    "latitude": 6.954,
    "longitude": 100.3915,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "จุดผ่านของคลองหลาก่อนเข้าเขตควนลัง-หาดใหญ่"
  },
  {
    "id": "lm-community-175",
    "name": "บ้านโหนด (หมู่ที่ 2 ต.คลองหลา)",
    "aliases": [
      "บ้านโหนด",
      "หมู่ 2 คลองหลา",
      "บ้านโหนดคลองหลา"
    ],
    "category": "COMMUNITY",
    "latitude": 6.949,
    "longitude": 100.384,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหลา ใกล้สนามบินหาดใหญ่"
  },
  {
    "id": "lm-community-176",
    "name": "บ้านใหม่ (หมู่ที่ 3 ต.คลองหลา)",
    "aliases": [
      "บ้านใหม่",
      "หมู่ 3 คลองหลา",
      "บ้านใหม่คลองหลา"
    ],
    "category": "COMMUNITY",
    "latitude": 6.945,
    "longitude": 100.378,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหลา"
  },
  {
    "id": "lm-community-177",
    "name": "บ้านทอนไม้ไผ่ (หมู่ที่ 4 ต.คลองหลา)",
    "aliases": [
      "บ้านทอนไม้ไผ่",
      "หมู่ 4 คลองหลา",
      "ทอนไม้ไผ่"
    ],
    "category": "COMMUNITY",
    "latitude": 6.938,
    "longitude": 100.369,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ใกล้ทางเข้าอ่างเก็บน้ำคลองหลา"
  },
  {
    "id": "lm-community-178",
    "name": "บ้านสายแซะ (หมู่ที่ 5 ต.คลองหลา)",
    "aliases": [
      "บ้านสายแซะ",
      "หมู่ 5 คลองหลา",
      "สายแซะ"
    ],
    "category": "COMMUNITY",
    "latitude": 6.958,
    "longitude": 100.375,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหลา รอยต่อตำบลทุ่งตำเสา"
  },
  {
    "id": "lm-community-179",
    "name": "บ้านต้นส้าน (หมู่ที่ 6 ต.คลองหลา)",
    "aliases": [
      "บ้านต้นส้าน",
      "หมู่ 6 คลองหลา",
      "ต้นส้าน"
    ],
    "category": "COMMUNITY",
    "latitude": 6.932,
    "longitude": 100.376,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "ตำบลคลองหลา"
  },
  {
    "id": "lm-community-180",
    "name": "บ้านช่างแก้ว (หมู่ที่ 7 ต.คลองหลา)",
    "aliases": [
      "บ้านช่างแก้ว",
      "หมู่ 7 คลองหลา",
      "ช่างแก้ว"
    ],
    "category": "COMMUNITY",
    "latitude": 6.941,
    "longitude": 100.362,
    "subdistrict": "คลองหลา",
    "district": "คลองหอยโข่ง",
    "province": "สงขลา",
    "description": "บริเวณอ่างเก็บน้ำคลองหลา"
  },
  {
    "id": "supp-community-181",
    "name": "ย่านช่องเขา (ถนนธรรมนูญวิถีตัดศุภสารรังสรรค์)",
    "aliases": [
      "ช่องเขา",
      "แถวช่องเขา",
      "แยกช่องเขา",
      "ทางรถไฟช่องเขา"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0125,
    "longitude": 100.4925,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านช่องเขา ถ.ธรรมนูญวิถี ทางข้ามทางรถไฟ"
  },
  {
    "id": "supp-mall-182",
    "name": "ตลาดสันติสุข",
    "aliases": [
      "สันติสุข",
      "ตลาดสันติสุข"
    ],
    "category": "MALL",
    "latitude": 7.0061,
    "longitude": 100.4708,
    "subdistrict": "หาดใหญ่",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านการค้าสันติสุข ใกล้ตลาดกิมหยง"
  },
  {
    "id": "supp-community-183",
    "name": "ประตู 108 - 109 ม.อ.",
    "aliases": [
      "108",
      "109",
      "ประตู108",
      "ประตู109",
      "ซอย108",
      "ซอย109",
      "หน้ามอ"
    ],
    "category": "COMMUNITY",
    "latitude": 7.0088,
    "longitude": 100.5025,
    "subdistrict": "คอหงส์",
    "district": "หาดใหญ่",
    "province": "สงขลา",
    "description": "ย่านหอพักนักศึกษาและร้านค้ารอบรั้ว ม.อ."
  }
];

/**
 * ฟังก์ชันค้นหาแลนด์มาร์กในพจนานุกรมท้องถิ่น (Local In-Memory Fuzzy / Substring Search)
 */
export function searchLocalLandmarks(query: string, maxResults: number = 6): LocalLandmark[] {
  if (!query || !query.trim()) return [];

  const clean = query
    .toLowerCase()
    .replace(/[.\s\-_/]/g, '')
    .trim();

  if (clean.length === 0) return [];

  const scoredResults: { landmark: LocalLandmark; score: number }[] = [];

  for (const item of HATYAI_LANDMARKS) {
    let bestScore = 0;

    // Check exact or partial match on primary name
    const cleanName = item.name.toLowerCase().replace(/[.\s\-_/]/g, '');
    if (cleanName === clean) {
      bestScore = Math.max(bestScore, 100);
    } else if (cleanName.includes(clean)) {
      bestScore = Math.max(bestScore, 70);
    }

    // Check aliases
    for (const alias of item.aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[.\s\-_/]/g, '');
      if (cleanAlias === clean) {
        bestScore = Math.max(bestScore, 95);
      } else if (cleanAlias.includes(clean) || clean.includes(cleanAlias)) {
        bestScore = Math.max(bestScore, 60);
      }
    }

    // Check subdistrict or district
    const cleanSub = item.subdistrict.toLowerCase().replace(/[.\s\-_/]/g, '');
    if (cleanSub.includes(clean) || clean.includes(cleanSub)) {
      bestScore = Math.max(bestScore, 40);
    }

    if (bestScore > 0) {
      scoredResults.push({ landmark: item, score: bestScore });
    }
  }

  // Sort by highest score descending
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, maxResults).map((r) => r.landmark);
}

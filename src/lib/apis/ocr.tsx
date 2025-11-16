import axios from "axios";

export async function postOcrMenuImage(
  file: File,
  storeId: number
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("image", file); // 파일 추가
    formData.append("store_id", storeId.toString()); // store_id 추가

    const response = await axios.post(
      "https://primary-production-b57a.up.railway.app/webhook/ecf3e505-ee0e-439f-9ebc-50d4f2c63e61", // API 엔드포인트
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // form-data 전송
        },
      }
    );

    return response.data; // 성공 시 응답 데이터 반환
  } catch (error) {
    console.error("Error posting OCR data:", error);
    throw error; // 에러 발생 시 throw
  }
}

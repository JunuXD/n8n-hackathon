# 🥐 빵가게를 위한 서비스 "**빵터짐**"
**소개**  
n8n 워크플로우 기반 **스마트 재고·발주 관리 시스템**입니다.   
빵집 운영의 번거로운 재고·발주 관리를 자동화하여,  효율적이고 체계적인 운영을 지원하는 서비스입니다.  

**수상** 

본 프로젝트는 Upstage에서 진행한 SW중심대학 신촌지역협의회 AI Workflow Hackathon에서 **장려상을 수상**했습니다. 🏆


**기술 스택**

- **Frontend:** React, TailwindCSS, React Query  
- **Backend / Automation:** n8n, Upstage OCR API, Supabase Edge Functions  
- **Infra / Tools:** Supabase, GitHub Actions, Vercel/Netlify
  
## 📌 서비스 소개 & 문제 정의

빵터짐은 빵집 운영에서 흔히 발생하는 다음 문제들을 해결하고자 개발되었습니다.

- 메뉴/레시피 정보 관리가 수작업으로 이루어져 **업데이트 누락** 발생  
- 생산량과 판매량 연동이 어려워 **재고 부족 또는 과잉** 발생  
- 발주 시점을 놓쳐 **품절** 또는 불필요한 발주 발생  



## 💡 문제 해결 방법

- OCR 기반 메뉴·레시피 자동 인식 → 수작업 최소화  
- 실시간 생산·판매 연동 재고 관리 → 정확한 재고 파악  
- 자동 품절·발주 알림 → 적시 발주 지원  
- 데이터 모델 기반 통합 관리 → 메뉴·레시피·재고·발주 전 주기 관리  


## 🚀 주요 기능

### ✔ OCR 기반 메뉴·레시피 자동 등록
- Upstage OCR API로 메뉴·레시피 문서/사진 자동 인식  
- 인식 데이터 정제 후 Supabase DB 자동 Insert  

### ✔ 실시간 생산·판매 연동 재고 관리
- 생산 계획/판매 실적 실시간 반영  
- 레시피 기반 원재료 소진량 자동 계산  
- 품절 임계치 알림 및 발주 추천  

### ✔ 자동 품절·발주 알림
- 이메일 알림 전송  
- 발주 수량 자동 산출 및 n8n 워크플로우 트리거  

### ✔ 데이터 모델 기반 통합 관리 엔진
- 메뉴–레시피–원재료–재고–발주 간 구조화된 데이터 모델  
- n8n 기반 유연한 자동화 워크플로우 구현  



## 🔄 주요 워크플로우 (n8n)

### 1. 메뉴 자동 등록 워크플로우
1. 이미지/문서 업로드
2. Upstage OCR API 호출
3. 텍스트 추출 및 정제 (메뉴명, 가격 등)
4. Supabase DB Insert/Update

### 2. 레시피 자동 등록 워크플로우
1. 이미지/문서 업로드
2. Upstage Document Parser API 호출
3. 텍스트 추출 및 정제 (메뉴명, 레시피, 원재료 등)
4. Supabase DB Insert (메뉴 테이블)
5. 원재료 자동 생성 및 DB Insert
6. 메뉴-원재료 관계 테이블 생성 및 매핑

### 3. 재고·발주 관리 워크플로우
1. 생산·판매 데이터 수집
2. 재고 상태 계산
3. 임계치 도달 시 알림 전송
4. 발주 필요 수량 산출 및 자동 발주 트리거

### 4. 주문 내역 실시간 반영 워크플로우
1. DB 업데이트 및 재고 연동
2. 알림/대시보드 실시간 갱신



## 팀원 역할 요약

| 역할 | 담당 내용 |
|------|-----------|
| 데이터베이스 설계 | 메뉴/레시피/원재료/재고/발주 ERD 설계, Supabase 스키마 구성 |
| n8n 워크플로우 | OCR 기반 메뉴·레시피 자동 등록, 재고·발주 알림, Webhook 연동 |
| 프론트엔드 | 주문/메뉴/발주 UI 개발, Supabase CRUD 연동, 실시간 재고 반영 |
| 기획/관리 | 서비스 구조 설계, 기능 정의, 프로젝트 일정 관리 |

## 프로젝트 데모
[Video Demo](https://www.youtube.com/watch?v=6IhpxADIKyU)
### 메인 대시보드

- **영업 상태 관리:** 영업중 / 영업 종료 상태 표시  
- **매출 현황:** 오늘의 매출, 총 매출, 총 수량  
- **빠른 이동:** 주문 내역 관리, 메뉴 관리, 재료 관리, 발주 관리 페이지로 바로 이동 가능  

<img width="2754" height="1468" alt="image" src="https://github.com/user-attachments/assets/6b69b376-39fa-4825-b0d9-06cc4e2dab57" />



### 주문 내역 관리

- 전체 주문 내역 확인  
- 주문 상태, 수량, 결제 내역 등 관리

<img width="2000" height="1105" alt="image" src="https://github.com/user-attachments/assets/b9709455-fe0b-404b-ac86-11f55a12f173" />




### 메뉴 관리

- **품절 임박 메뉴 확인**  
- **빵 만들기 버튼:**  
  - 미리 지정된 개수로 메뉴 업데이트  
  - 재고 임계치 미만 시 자동 알림  
- **메뉴 등록:** OCR을 통한 직접 추가 가능  
- **레시피 등록:** OCR 기반 레시피 등록  
  - 등록 후 메뉴 상세 페이지에서 **재료 세부 내역 확인 가능**  

<img width="2000" height="1919" alt="image" src="https://github.com/user-attachments/assets/dc051348-7217-406f-aea7-cb26ffd32bea" />



- **메뉴 상세 페이지**

<img width="2388" height="2124" alt="image" src="https://github.com/user-attachments/assets/7edc0e2f-06cb-49b4-83bf-d32e22fd1f49" />




### 재고 관리

- **재고 상태 표시 바:**  
  - 충분: 파란색  
  - 임박: 노란색  
  - 부족: 빨간색  
- 재고 수량 및 임계치 실시간 반영  

<img width="2734" height="1458" alt="image" src="https://github.com/user-attachments/assets/3d243604-1dbf-41aa-a11d-209356e054d6" />


---

### 발주 관리

- 발주 현황 확인  
- 발주 완료 시 해당 재료 **자동 재고 업데이트**  
- 자동 발주 알림 및 수량 산출 기능 포함  

<img width="2734" height="1458" alt="image" src="https://github.com/user-attachments/assets/21fa27b0-7ff6-4502-9567-8ac1c43579ab" />




## 손님용 페이지

<img width="2754" height="1468" alt="image" src="https://github.com/user-attachments/assets/ab93f1a8-2bfd-41d4-84ad-fed80c72087f" />


### 챗봇

- 영업 시간 안내  
- 재고 현황 조회  
- 인기 메뉴 추천  

<img width="2754" height="1468" alt="image" src="https://github.com/user-attachments/assets/dc41fa50-261a-4e89-bed1-47d7926d7e43" />


### 주문하기

- 재고 있는 메뉴 바로 주문 가능  
- 주문 시 재고 자동 반영

<img width="2000" height="1133" alt="image" src="https://github.com/user-attachments/assets/cf69d768-3f4c-46b1-83ea-7dde7b755b13" />


<img width="2734" height="1458" alt="image" src="https://github.com/user-attachments/assets/57252bd2-a369-4460-9e16-99666a4f4735" />




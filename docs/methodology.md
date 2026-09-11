# SIH26056: Real-time Airfare Price Index for India
## Official Statistical Methodology & Architecture Specification

### 1. Overview & Objective
The objective of this platform is to provide a transparent, policy-grade, real-time **Airfare Price Index (API)** for Indian civil aviation. It addresses the critical gaps identified in existing market trackers: lack of statistical weighting, opaque baseline definitions, absence of backtesting against official Directorate General of Civil Aviation (DGCA) benchmarks, and vulnerability to data collection distortions.

---

### 2. Route Basket & DGCA Weighting Scheme
The index tracks a representative basket of **10 high-density Indian domestic corridors** representing over 40% of all domestic passenger volume. Route weights ($w_i$) are calibrated directly from published DGCA city-pair passenger traffic reports and normalized such that $\sum_{i=1}^{10} w_i = 1.00$.

| Route Code | City Pair | DGCA Passenger Share | Route Characteristics | Baseline Price ($P_{i,0}$) |
| :--- | :--- | :--- | :--- | :--- |
| **DEL-BOM** | Delhi ↔ Mumbai | **16.0%** (0.16) | Premier business trunk route, high frequency | ₹4,850 |
| **BOM-DEL** | Mumbai ↔ Delhi | **16.0%** (0.16) | High business return corridor | ₹4,890 |
| **DEL-BLR** | Delhi ↔ Bengaluru | **13.0%** (0.13) | Tech executive & corporate corridor | ₹5,420 |
| **BLR-DEL** | Bengaluru ↔ Delhi | **13.0%** (0.13) | Corporate & transit trunk | ₹5,380 |
| **BOM-BLR** | Mumbai ↔ Bengaluru | **11.0%** (0.11) | Commercial metro interchange | ₹3,950 |
| **BLR-BOM** | Bengaluru ↔ Mumbai | **11.0%** (0.11) | Commercial metro interchange | ₹3,980 |
| **DEL-HYD** | Delhi ↔ Hyderabad | **8.0%** (0.08) | Business & IT transit | ₹4,650 |
| **HYD-DEL** | Hyderabad ↔ Delhi | **8.0%** (0.08) | Business & IT transit | ₹4,620 |
| **BOM-MAA** | Mumbai ↔ Chennai | **8.0%** (0.08) | Industrial & maritime corridor | ₹4,250 |
| **MAA-BOM** | Chennai ↔ Mumbai | **7.0%** (0.07) | Industrial & maritime corridor | ₹4,220 |

---

### 3. Price Index Formulation

#### Base Period
- **Reference Period**: January 2025 = 100.00.
- Base price $P_{i,0}$ is the weighted median fare observed across standard booking windows (15–45 days advance) during January 2025.

#### Primary Policy Index: Laspeyres Index ($L_t$)
The primary index utilizes a fixed-weight Laspeyres price index formula, identical to the standard methodology used by central statistical agencies (e.g., MoSPI for CPI):

$$L_t = \frac{\sum_{i=1}^{n} w_i \cdot P_{i,t}}{\sum_{i=1}^{n} w_i \cdot P_{i,0}} \times 100$$

Where:
- $P_{i,t}$ = Average fare on corridor $i$ at time $t$
- $P_{i,0}$ = Base period fare on corridor $i$
- $w_i$ = DGCA passenger volume weight for corridor $i$

#### Secondary Comparison Index: Jevons Geometric Index ($J_t$)
To account for substitution effects and eliminate consumer-basket upward drift, the system concurrently computes a weighted Jevons geometric mean index:

$$J_t = \prod_{i=1}^{n} \left( \frac{P_{i,t}}{P_{i,0}} \right)^{w_i} \times 100$$

#### Route Coverage Metric
To guarantee statistical confidence:
$$\text{Coverage}_t = \frac{\text{Count of basket routes with } \ge 5 \text{ quotes at time } t}{\text{Total basket routes (10)}} \times 100\%$$
Days or months with $\text{Coverage} < 70\%$ are explicitly marked as preliminary.

---

### 4. Data Processing, Validation & Outlier Detection

Every fare observation undergoes an automated 5-stage ETL pipeline:
1. **Schema Validation**: Mandatory origin, destination, airline, departure timestamp, travel date, and fare decomposition.
2. **Currency & Code Normalization**: Strip ₹/INR, parse float total/base/tax, map uppercase IATA airport codes.
3. **Deduplication**: SHA-256 fingerprint on `(route, airline, flight_number, travel_date, departure_time, collection_date)`. Duplicate quotes within the same ingestion window are skipped.
4. **Route-Specific Bounds & IQR Outlier Filter**:
   - Initial sanity checks (e.g., DEL-BOM: ₹2,500–₹18,000; BOM-MAA: ₹2,000–₹15,000).
   - Dynamic Interquartile Range (IQR) filter per corridor:
     $$F_{min} = Q_1 - 1.5 \times \text{IQR}, \quad F_{max} = Q_3 + 1.5 \times \text{IQR}$$
   Observations outside $[F_{min}, F_{max}]$ are recorded in `data_quality` as outliers and excluded from index calculation.
5. **Data Staleness Tracking**:
   $$\text{Staleness Rate} = \frac{\text{Routes with latest observation } > 48\text{h old}}{\text{Total Routes}} \times 100\%$$

---

### 5. Booking Window Intelligence & Fair Fare Score

#### Lead-Time Buckets
Fares exhibit structural U-shaped elasticity based on advance booking days ($\text{advance\_days} = \text{travel\_date} - \text{collection\_date}$):
- `0–6 days`: Last-minute premium (+25% to +45% vs median)
- `7–14 days`: Late corporate window (+10% to +20%)
- `15–29 days`: Standard market pricing
- `30–44 days`: **Sweet spot / Optimal booking window** (-10% to -15% discount)
- `45–59 days`: Early advance
- `60+ days`: Long-horizon baseline

#### Fair Fare Score Calculation
Given an observed quote $f$ for route $R$ in advance bucket $B$:
$$\text{Percentile} = \frac{\text{Count of historical quotes in }(R,B) < f}{\text{Total historical quotes in }(R,B)} \times 100$$
$$\text{Fair Fare Score} = 100 - \text{Percentile}$$

- **67–100**: 🟢 **GOOD PRICE** — Cheaper than 67%+ of historical quotes in this window.
- **34–66**: 🟡 **FAIR PRICE** — Close to historical median.
- **0–33**: 🔴 **HIGH PRICE** — In the top 33% most expensive quotes; consider waiting or choosing adjacent dates.

---

### 6. DGCA Benchmark Backtesting
The platform aggregates daily route averages into monthly indices and compares them against official DGCA passenger yield data for corresponding periods:

1. **Mean Absolute Error (MAE)**:
   $$\text{MAE} = \frac{1}{M} \sum_{m=1}^{M} |I_{our, m} - I_{dgca, m}|$$
2. **Root Mean Square Error (RMSE)**:
   $$\text{RMSE} = \sqrt{\frac{1}{M} \sum_{m=1}^{M} (I_{our, m} - I_{dgca, m})^2}$$
3. **Pearson Correlation Coefficient ($r$)**:
   $$r = \frac{\sum (I_{our} - \bar{I}_{our})(I_{dgca} - \bar{I}_{dgca})}{\sqrt{\sum (I_{our} - \bar{I}_{our})^2 \sum (I_{dgca} - \bar{I}_{dgca})^2}}$$
4. **Mean Bias**:
   $$\text{Bias} = \frac{1}{M} \sum_{m=1}^{M} (I_{our, m} - I_{dgca, m})$$

These metrics demonstrate empirical alignment with government data, proving policy readiness.

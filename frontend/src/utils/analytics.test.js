import test from "node:test"
import assert from "node:assert/strict"
import {
  dayNumber, normalizeSales, weekendComparison, weekdaySales, mean,
  pearson, monthlySales, filterPeriod, rainyComparison, temperatureBands,
  weatherSales, summarize,
} from "./analytics.js"

test("weekday is independent of browser timezone", () => {
  assert.equal(dayNumber("2026-10-25"), 0)
  assert.equal(dayNumber("2026-10-24"), 6)
  assert.equal(dayNumber("2026-10-26"), 1)
  assert.equal(dayNumber("2026-02-30"), null)
})

test("missing sales is excluded, zero sales included, dates sorted", () => {
  const rows = normalizeSales([
    { entry_date: "2026-10-25", net_daily_sales: "300" },
    { entry_date: "2026-10-22", net_daily_sales: null },
    { entry_date: "2026-10-24", net_daily_sales: 0 },
  ])
  assert.deepEqual(rows.map(r => r.sales), [0, 300])
  assert.equal(weekendComparison(rows).weekday.count, 0)
  assert.equal(weekendComparison(rows).weekend.mean, 150)
})

test("weekend comparison and seven weekday categories", () => {
  const rows = normalizeSales([
    { entry_date: "2026-10-23", net_daily_sales: 100 },
    { entry_date: "2026-10-24", net_daily_sales: 200 },
    { entry_date: "2026-10-25", net_daily_sales: 300 },
  ])
  assert.equal(weekendComparison(rows).difference, 150)
  assert.equal(weekdaySales(rows)[5].mean, 200)
  assert.equal(weekdaySales(rows)[6].mean, 300)
})

test("correlations handle no variation and a perfect relationship", () => {
  assert.equal(pearson([{x:1,y:2},{x:2,y:4},{x:3,y:6}]), 1)
  assert.equal(pearson([{x:1,y:3},{x:1,y:4},{x:1,y:5}]), null)
  assert.equal(pearson([{x:1,y:2}]), null)
})

test("monthly average differs from monthly total, and periods filter by latest date", () => {
  const rows = normalizeSales([
    {entry_date:"2026-09-01",net_daily_sales:10},
    {entry_date:"2026-10-24",net_daily_sales:50},
    {entry_date:"2026-10-25",net_daily_sales:150},
  ])
  assert.deepEqual(monthlySales(rows).map(x => x.mean), [10, 100])
  assert.equal(filterPeriod(rows, 1).length, 1)
  assert.equal(filterPeriod(rows, 30).length, 2)
})

test("rainfall uses shop-hour values including zero; weather 0 is not missing", () => {
  const rows = normalizeSales([
    {entry_date:"2026-10-23",net_daily_sales:100,shop_precipitation_mm:0,precipitation_sum_mm:9},
    {entry_date:"2026-10-24",net_daily_sales:200,shop_precipitation_mm:4},
  ])
  assert.equal(rainyComparison(rows)[0].mean, 100)
  assert.equal(rainyComparison(rows)[1].mean, 200)
  assert.equal(weatherSales(rows,"shop_precipitation_mm")[0].x, 0)
})

test("temperature bands require at least six matched days", () => {
  const rows = Array.from({length: 9}, (_, i) => ({
    entry_date: `2026-10-${String(i + 1).padStart(2,"0")}`,
    net_daily_sales: 100 + i,
    shop_temp_mean_c: 26 + i,
  }))
  const bands = temperatureBands(normalizeSales(rows))
  assert.equal(bands.length, 3)
  assert.deepEqual(bands.map(b => b.count), [3,3,3])
  assert.equal(mean([]), null)
  assert.equal(summarize([]).total, 0)
})

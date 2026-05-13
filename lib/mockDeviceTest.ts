export type DeviceTestResult = {
  status: "ok" | "fail" | "pending"
  label: string
  value: string | null
}

const SUCCESS_RATES = {
  routerInternetStatus: 0.001,
  lineAvailability: 0.99,
}

const TEST_DELAYS_MS = {
  routerInternetStatus: { min: 5000, max: 10000 },
  lineAvailability: { min: 2000, max: 70000 },
}

function randomDelay(min: number, max: number): Promise<void> {
  const ms = min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function runTest(successRate: number): "ok" | "fail" {
  return Math.random() < successRate ? "ok" : "fail"
}

export async function runRouterInternetStatus(): Promise<DeviceTestResult> {
  await randomDelay(TEST_DELAYS_MS.routerInternetStatus.min, TEST_DELAYS_MS.routerInternetStatus.max)
  return { status: runTest(SUCCESS_RATES.routerInternetStatus), label: "Internett-status", value: null }
}

export async function runLineAvailability(): Promise<DeviceTestResult> {
  await randomDelay(TEST_DELAYS_MS.lineAvailability.min, TEST_DELAYS_MS.lineAvailability.max)
  return { status: runTest(SUCCESS_RATES.lineAvailability), label: "Linjetest", value: null }
}

export function initialDeviceTests(): { routerInternetStatus: DeviceTestResult; lineAvailability: DeviceTestResult } {
  return {
    routerInternetStatus: { status: "pending", label: "Internett-status", value: null },
    lineAvailability: { status: "pending", label: "Linjetest", value: null },
  }
}

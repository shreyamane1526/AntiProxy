/**
 * BLE Proximity Service
 * Verifies physical proximity of student registered device to classroom beacon.
 */
export class BleService {
  static verifyProximity({ studentDeviceIdentifier, sessionDeviceName, bleRssi, bleSupported = true }) {
    if (!bleSupported) {
      return {
        status: 'BLE_UNSUPPORTED',
        verified: false,
        message: 'Bluetooth scanning unsupported on student device browser',
      };
    }

    if (!sessionDeviceName) {
      return {
        status: 'BLE_FAILED',
        verified: false,
        message: 'No classroom BLE beacon active for session',
      };
    }

    // Check RSSI if provided (signal strength threshold > -85 dBm)
    if (bleRssi !== undefined && bleRssi < -85) {
      return {
        status: 'BLE_FAILED',
        verified: false,
        message: 'Device out of physical classroom proximity range',
      };
    }

    return {
      status: 'BLE_VERIFIED',
      verified: true,
      message: `Proximity verified to ${sessionDeviceName}`,
    };
  }
}

/**
 * RIDEX — Emergency Contact & Offline SOS Dispatcher
 * Manages emergency contacts, phone dialer integration, and SMS with precise GPS coordinates.
 */

import { Linking, Platform, Alert } from 'react-native';
import { EmergencyContact } from '../types/user';
import { MapCoordinate } from './maps/mapTypes';
import { logger } from '../utils/logger';

export class EmergencyContactService {
  private static instance: EmergencyContactService | null = null;

  public static getInstance(): EmergencyContactService {
    if (!EmergencyContactService.instance) {
      EmergencyContactService.instance = new EmergencyContactService();
    }
    return EmergencyContactService.instance;
  }

  /**
   * Directly initiates a phone call to the emergency contact.
   */
  async callContact(phone: string): Promise<boolean> {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanPhone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert('Unable to Call', `Could not open dialer for ${phone}`);
        return false;
      }
    } catch (error) {
      logger.error('[EmergencyContactService] Call error:', error);
      Alert.alert('Emergency Call', `Please dial: ${phone}`);
      return false;
    }
  }

  /**
   * Formats and opens the native SMS client with current GPS location pre-filled.
   */
  async sendEmergencySms(
    contact: EmergencyContact,
    riderName: string,
    coordinate?: MapCoordinate | null,
    issueDescription?: string
  ): Promise<boolean> {
    const cleanPhone = contact.phone.replace(/[^0-9+]/g, '');
    const locText = coordinate
      ? `https://maps.google.com/?q=${coordinate.latitude.toFixed(6)},${coordinate.longitude.toFixed(6)}`
      : 'Location unavailable';

    const message = `🚨 EMERGENCY ALERT from RideX!\n${riderName} needs urgent assistance on a motorcycle ride.\nIssue: ${issueDescription || 'Immediate Help Needed'}\nLocation: ${locText}`;

    const encoded = encodeURIComponent(message);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${cleanPhone}${separator}body=${encoded}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert('Emergency SMS', message);
        return false;
      }
    } catch (error) {
      logger.error('[EmergencyContactService] SMS error:', error);
      Alert.alert('Emergency SMS Text', message);
      return false;
    }
  }
}

export const emergencyContactService = EmergencyContactService.getInstance();

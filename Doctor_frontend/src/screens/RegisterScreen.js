import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { auth } from '../firebase/firebaseService';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { COLORS } from '../constants/colors';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    licenseNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const uid = userCredential.user.uid;

      // Save doctor profile to Firestore
      await setDoc(doc(db, 'doctors', uid), {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        createdAt: new Date().toISOString(),
        role: 'doctor',
        uid: uid,
      });

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: formData.fullName,
      });

      Alert.alert(
        'Success',
        'Registration successful! Please login with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      
      // Handle Firebase Auth errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            message = 'This email is already registered. Please use a different email or try logging in.';
            break;
          case 'auth/invalid-email':
            message = 'Invalid email address. Please check your email format.';
            break;
          case 'auth/weak-password':
            message = 'Password is too weak. Please use at least 6 characters.';
            break;
          case 'auth/operation-not-allowed':
            message = 'Email/password accounts are not enabled. Please contact support.';
            break;
          case 'auth/network-request-failed':
            message = 'Network error. Please check your internet connection.';
            break;
          default:
            message = error.message || 'Registration failed. Please try again.';
        }
      } else if (error.message) {
        // Handle API errors that might not have error.code
        if (error.message.includes('EMAIL_EXISTS') || error.message.includes('email-already-in-use')) {
          message = 'This email is already registered. Please use a different email or try logging in.';
        } else {
          message = error.message;
        }
      }
      
      console.error('Registration error:', error);
      
      // If email exists, offer to navigate to login
      if (error.code === 'auth/email-already-in-use' || 
          (error.message && error.message.includes('EMAIL_EXISTS'))) {
        Alert.alert(
          'Email Already Registered',
          'This email is already registered. Would you like to log in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Login', 
              onPress: () => navigation.replace('Login')
            }
          ]
        );
      } else {
        Alert.alert('Registration Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Register as a Healthcare Professional
            </Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.fullName && styles.inputError,
                ]}
              >
                <Text style={styles.inputIcon}>👨‍⚕️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dr. John Doe"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.fullName}
                  onChangeText={text => updateField('fullName', text)}
                />
              </View>
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.username && styles.inputError,
                ]}
              >
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="johndoe"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.username}
                  onChangeText={text =>
                    updateField('username', text.toLowerCase().trim())
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View
                style={[styles.inputWrapper, errors.email && styles.inputError]}
              >
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="doctor@hospital.com"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.email}
                  onChangeText={text =>
                    updateField('email', text.toLowerCase().trim())
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Specialization */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specialization *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.specialization && styles.inputError,
                ]}
              >
                <Text style={styles.inputIcon}>🏥</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., HIV Specialist, Infectious Disease"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.specialization}
                  onChangeText={text => updateField('specialization', text)}
                />
              </View>
              {errors.specialization && (
                <Text style={styles.errorText}>{errors.specialization}</Text>
              )}
            </View>

            {/* License Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medical License Number</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📋</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.licenseNumber}
                  onChangeText={text => updateField('licenseNumber', text)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputError,
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.password}
                  onChangeText={text => updateField('password', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
<Text style={styles.eyeIconText}>
{showPassword ? '👁️' : '👁️‍🗨️'}
</Text>
</TouchableOpacity>
</View>
{errors.password && (
<Text style={styles.errorText}>{errors.password}</Text>
)}
</View>
        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.confirmPassword && styles.inputError,
            ]}
          >
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.confirmPassword}
              onChangeText={text => updateField('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Text style={styles.eyeIconText}>
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By registering, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginLinkText}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
);
};
const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: COLORS.background,
},
keyboardView: {
flex: 1,
},
scrollContent: {
flexGrow: 1,
paddingBottom: 30,
},
header: {
paddingTop: 20,
paddingHorizontal: 20,
paddingBottom: 20,
},
backButton: {
marginBottom: 20,
},
backButtonText: {
fontSize: 16,
color: COLORS.primary,
fontWeight: '600',
},
title: {
fontSize: 32,
fontWeight: 'bold',
color: COLORS.text,
marginBottom: 8,
},
subtitle: {
fontSize: 16,
color: COLORS.textSecondary,
},
formContainer: {
paddingHorizontal: 20,
},
inputGroup: {
marginBottom: 20,
},
label: {
fontSize: 14,
fontWeight: '600',
color: COLORS.text,
marginBottom: 8,
},
inputWrapper: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: COLORS.white,
borderRadius: 12,
borderWidth: 1,
borderColor: COLORS.border,
paddingHorizontal: 15,
height: 56,
},
inputError: {
borderColor: COLORS.danger,
borderWidth: 1.5,
},
inputIcon: {
fontSize: 20,
marginRight: 10,
},
input: {
flex: 1,
fontSize: 16,
color: COLORS.text,
paddingVertical: 0,
},
eyeIcon: {
padding: 5,
},
eyeIconText: {
fontSize: 18,
},
errorText: {
fontSize: 12,
color: COLORS.danger,
marginTop: 5,
marginLeft: 5,
},
termsContainer: {
marginTop: 15,
marginBottom: 10,
},
termsText: {
fontSize: 12,
color: COLORS.textSecondary,
textAlign: 'center',
lineHeight: 18,
},
termsLink: {
color: COLORS.primary,
fontWeight: '600',
},
registerButton: {
backgroundColor: COLORS.success,
borderRadius: 12,
height: 56,
justifyContent: 'center',
alignItems: 'center',
shadowColor: COLORS.success,
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 8,
elevation: 5,
marginTop: 10,
},
buttonDisabled: {
opacity: 0.6,
},
buttonText: {
fontSize: 18,
fontWeight: 'bold',
color: COLORS.white,
},
loginLinkContainer: {
flexDirection: 'row',
justifyContent: 'center',
marginTop: 20,
},
loginLinkText: {
fontSize: 14,
color: COLORS.textSecondary,
},
loginLink: {
fontSize: 14,
color: COLORS.primary,
fontWeight: 'bold',
},
});
export default RegisterScreen;
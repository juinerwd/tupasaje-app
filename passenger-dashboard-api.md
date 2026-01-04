# 📱 API Documentation: Passenger Dashboard

## 🔐 Base URL
```
http://localhost:3001
```

## 🔑 Authentication
Todos los endpoints (excepto login/register) requieren JWT token en el header:
```typescript
headers: {
  'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
}
```

---

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Passenger Profile](#passenger-profile)
4. [Wallet](#wallet)
5. [Payments](#payments)
6. [Notifications](#notifications)
7. [Emergency Codes](#emergency-codes)

---

## 1. 🔐 Authentication

### POST `/auth/register`
Registrar nuevo usuario

**Request:**
```typescript
{
  firstName: string;
  lastName: string;
  typeDni: string;        // 'CC', 'TI', 'CE', 'PAS'
  numberDni: string;
  phoneNumber: string;
  email: string;
  pin: string;            // Exactamente 6 dígitos
  role: 'PASSENGER';
  acceptTerms: boolean;
}
```

**Response:** `201 Created`
```typescript
{
  user: {
    id: number;
    documentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: 'PASSENGER';
  };
  accessToken: string;
  refreshToken: string;
}
```

---

### POST `/auth/login`
Iniciar sesión

**Request:**
```typescript
{
  phoneNumber: string;  // Número de teléfono
  pin: string;          // Exactamente 6 dígitos
}
```

**Response:** `200 OK`
```typescript
{
  user: {
    id: number;
    documentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}
```

---

### POST `/auth/refresh`
Renovar access token

**Request:**
```typescript
{
  refreshToken: string;
}
```

**Response:** `200 OK`
```typescript
{
  accessToken: string;
  refreshToken: string;
}
```

---

### POST `/auth/logout`
Cerrar sesión

**Headers:** `Authorization: Bearer {token}`

**Request:**
```typescript
{
  refreshToken: string;
}
```

**Response:** `200 OK`
```typescript
{
  message: 'Logged out successfully';
}
```

---

### GET `/auth/me`
Obtener información del usuario autenticado

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'PASSENGER';
  avatar?: string;
  username?: string;
  qrCode?: string;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompleted: boolean;
  profileCompleteness: number;  // 0-100
  createdAt: string;
}
```

---

## 2. 👤 User Profile

### GET `/users/profile`
Obtener perfil completo del usuario

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  typeDni: string;
  numberDni: string;
  phoneNumber: string;
  email: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  username?: string;
  qrCode?: string;
  role: 'PASSENGER';
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  profileCompleted: boolean;
  profileCompleteness: number;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### PATCH `/users/profile`
Actualizar perfil de usuario

**Headers:** `Authorization: Bearer {token}`

**Request:**
```typescript
{
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}
```

**Response:** `200 OK`
```typescript
{
  // Usuario actualizado (mismo formato que GET /users/profile)
}
```

---

### GET `/users/profile/completeness`
Obtener completitud del perfil

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  completeness: number;  // 0-100
  completed: boolean;
  missing: string[];     // ['avatar', 'bio', 'dateOfBirth']
}
```

---

## 3. 🧳 Passenger Profile

### GET `/passengers/profile`
Obtener perfil de pasajero

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  id: number;
  userId: number;
  user: {
    id: number;
    documentId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    avatar?: string;
  };
  // Payment preferences
  preferredPaymentMethod?: string;
  autoRecharge: boolean;
  autoRechargeThreshold?: number;
  autoRechargeAmount?: number;
  // Trip preferences
  favoriteLocations?: Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    createdAt: string;
  }>;
  savedAddresses?: any[];
  // Statistics
  totalTrips: number;
  totalSpent: number;
  averageRating: number;
  totalRatings: number;
  // Emergency
  emergencyUsedAt?: string;
  emergencyCounter: number;
  createdAt: string;
  updatedAt: string;
}
```

---

### PATCH `/passengers/profile`
Actualizar perfil de pasajero

**Headers:** `Authorization: Bearer {token}`

**Request:**
```typescript
{
  preferredPaymentMethod?: string;
  autoRecharge?: boolean;
  autoRechargeThreshold?: number;
  autoRechargeAmount?: number;
  savedAddresses?: any[];
}
```

**Response:** `200 OK`
```typescript
{
  // Perfil actualizado (mismo formato que GET)
}
```

---

### POST `/passengers/favorite-locations`
Agregar ubicación favorita

**Headers:** `Authorization: Bearer {token}`

**Request:**
```typescript
{
  name: string;
  address: string;
  lat: number;
  lng: number;
}
```

**Response:** `201 Created`
```typescript
{
  // Perfil actualizado con nueva ubicación
  favoriteLocations: Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    createdAt: string;
  }>;
}
```

---

### DELETE `/passengers/favorite-locations/:id`
Eliminar ubicación favorita

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

### GET `/passengers/payment-history`
Obtener historial de pagos

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `limit` (optional): number, default 50
- `offset` (optional): number, default 0

**Response:** `200 OK`
```typescript
[
  {
    id: string;
    type: 'RECHARGE' | 'TRANSFER' | 'PAYMENT' | 'REFUND';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    amount: string;
    fee: string;
    netAmount: string;
    currency: 'COP';
    fromUserId?: number;
    toUserId?: number;
    description?: string;
    wompiTransactionId?: string;
    completedAt?: string;
    failedAt?: string;
    createdAt: string;
    updatedAt: string;
  }
]
```

---

## 4. 💰 Wallet

### GET `/wallet`
Obtener detalles completos de la wallet

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  id: number;
  userId: number;
  balance: string;          // Decimal as string
  heldBalance: string;      // Dinero en holds
  currency: 'COP';
  totalRecharged: string;
  totalSpent: string;
  totalReceived: string;
  isActive: boolean;
  isFrozen: boolean;
  frozenAt?: string;
  frozenReason?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### GET `/wallet/balance`
Obtener solo el balance

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  balance: string;
  currency: 'COP';
  totalRecharged: string;
  totalSpent: string;
  totalReceived: string;
  isActive: boolean;
  isFrozen: boolean;
}
```

---

### GET `/wallet/transactions`
Obtener transacciones de la wallet

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
[
  {
    id: string;
    type: 'RECHARGE' | 'TRANSFER' | 'PAYMENT' | 'REFUND';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    amount: string;
    fee: string;
    netAmount: string;
    currency: 'COP';
    fromUserId?: number;
    toUserId?: number;
    fromUser?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    toUser?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    description?: string;
    completedAt?: string;
    createdAt: string;
  }
]
```

---

## 5. 💳 Payments

### POST `/payment/recharge`
Recargar wallet con Wompi

**Headers:** `Authorization: Bearer {token}`

**Request:**
```typescript
{
  amount: number;              // Monto en COP
  paymentMethodType: string;   // 'CARD', 'NEQUI', 'PSE'
  redirectUrl?: string;        // URL de retorno
}
```

**Response:** `201 Created`
```typescript
{
  transaction: {
    id: string;
    type: 'RECHARGE';
    status: 'PENDING';
    amount: string;
    currency: 'COP';
    wompiTransactionId: string;
    createdAt: string;
  };
  paymentLink: string;  // URL de Wompi para completar pago
  reference: string;
}
```

---

### POST `/payment/transfer`
Transferir dinero a otro usuario

**Headers:** `Authorization: Bearer {token}`

**Request:**
```typescript
{
  toUserId: number;      // ID del destinatario
  amount: number;        // Monto en COP
  description?: string;
}
```

**Response:** `200 OK`
```typescript
{
  transaction: {
    id: string;
    type: 'TRANSFER';
    status: 'COMPLETED';
    amount: string;
    fee: string;
    netAmount: string;
    fromUserId: number;
    toUserId: number;
    description?: string;
    completedAt: string;
    createdAt: string;
  };
}
```

---

### GET `/payment/transaction/:id`
Obtener detalles de una transacción

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  id: string;
  type: 'RECHARGE' | 'TRANSFER' | 'PAYMENT' | 'REFUND';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: string;
  fee: string;
  netAmount: string;
  currency: 'COP';
  fromUserId?: number;
  toUserId?: number;
  description?: string;
  wompiTransactionId?: string;
  wompiReference?: string;
  wompiStatus?: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### GET `/payment/transactions`
Obtener todas las transacciones del usuario

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `limit` (optional): number, default 50
- `offset` (optional): number, default 0

**Response:** `200 OK`
```typescript
[
  {
    // Mismo formato que GET /payment/transaction/:id
  }
]
```

---

### GET `/payment/balance`
Obtener balance (alias de /wallet/balance)

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  balance: string;
  currency: 'COP';
}
```

---

## 6. 🔔 Notifications

### GET `/notifications`
Obtener notificaciones del usuario

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `type` (optional): 'AUTH' | 'PAYMENT' | 'RECHARGE' | 'SUPPORT' | 'SECURITY' | 'SYSTEM'
- `channel` (optional): 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
- `status` (optional): 'PENDING' | 'SENT' | 'FAILED' | 'READ'
- `limit` (optional): number, default 50
- `offset` (optional): number, default 0

**Response:** `200 OK`
```typescript
{
  notifications: [
    {
      id: string;
      userId: number;
      type: 'PAYMENT';
      channel: 'IN_APP';
      status: 'SENT';
      title: string;
      message: string;
      data?: any;
      sentAt?: string;
      readAt?: string;
      createdAt: string;
    }
  ];
  total: number;
  limit: number;
  offset: number;
}
```

---

### GET `/notifications/unread`
Obtener cantidad de notificaciones no leídas

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  unreadCount: number;
}
```

---

### PATCH `/notifications/:id/read`
Marcar notificación como leída

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  id: string;
  status: 'READ';
  readAt: string;
}
```

---

### PATCH `/notifications/read-all`
Marcar todas las notificaciones como leídas

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  count: number;  // Cantidad de notificaciones marcadas
}
```

---

### GET `/notifications/preferences`
Obtener preferencias de notificaciones

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```typescript
{
  id: number;
  userId: number;
  // Por canal
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  // Por tipo
  authNotifications: boolean;
  paymentNotifications: boolean;
  rechargeNotifications: boolean;
  supportNotifications: boolean;
  securityNotifications: boolean;
  systemNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

### PATCH `/notifications/preferences`
Actualizar preferencias de notificaciones

**Headers:** `Authorization: Bearer {token}`

**Request:**
```typescript
{
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  authNotifications?: boolean;
  paymentNotifications?: boolean;
  rechargeNotifications?: boolean;
  supportNotifications?: boolean;
  securityNotifications?: boolean;
  systemNotifications?: boolean;
}
```

**Response:** `200 OK`
```typescript
{
  // Preferencias actualizadas (mismo formato que GET)
}
```

---

## 7. 🚨 Emergency Codes

### POST `/passengers/emergency-code`
Generar código de emergencia

**Headers:** `Authorization: Bearer {token}`

**Response:** `201 Created`
```typescript
{
  code: string;        // Código de 8 caracteres (SOLO SE MUESTRA UNA VEZ)
  expiresAt: string;   // Fecha de expiración (30 días)
}
```

⚠️ **IMPORTANTE**: El código solo se muestra una vez. El usuario debe guardarlo.

---

### POST `/passengers/verify-emergency-code`
Verificar código de emergencia

**Headers:** `Authorization: Bearer {token}`

**Request:**
```typescript
{
  code: string;
}
```

**Response:** `200 OK`
```typescript
{
  valid: boolean;
}
```

---

## 📱 TypeScript Interfaces

```typescript
// User
interface User {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  typeDni: string;
  numberDni: string;
  phoneNumber: string;
  email: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  username?: string;
  qrCode?: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  profileCompleted: boolean;
  profileCompleteness: number;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Passenger
interface Passenger {
  id: number;
  userId: number;
  user: Partial<User>;
  preferredPaymentMethod?: string;
  autoRecharge: boolean;
  autoRechargeThreshold?: number;
  autoRechargeAmount?: number;
  favoriteLocations?: FavoriteLocation[];
  savedAddresses?: any[];
  totalTrips: number;
  totalSpent: number;
  averageRating: number;
  totalRatings: number;
  emergencyUsedAt?: string;
  emergencyCounter: number;
  createdAt: string;
  updatedAt: string;
}

// Wallet
interface Wallet {
  id: number;
  userId: number;
  balance: string;
  heldBalance: string;
  currency: string;
  totalRecharged: string;
  totalSpent: string;
  totalReceived: string;
  isActive: boolean;
  isFrozen: boolean;
  frozenAt?: string;
  frozenReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction
interface Transaction {
  id: string;
  type: 'RECHARGE' | 'TRANSFER' | 'PAYMENT' | 'REFUND' | 'REVERSAL';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: string;
  fee: string;
  netAmount: string;
  currency: string;
  fromUserId?: number;
  toUserId?: number;
  fromUser?: Partial<User>;
  toUser?: Partial<User>;
  description?: string;
  wompiTransactionId?: string;
  wompiReference?: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification
interface Notification {
  id: string;
  userId: number;
  type: 'AUTH' | 'PAYMENT' | 'RECHARGE' | 'SUPPORT' | 'SECURITY' | 'SYSTEM' | 'EMERGENCY';
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  title: string;
  message: string;
  data?: any;
  sentAt?: string;
  readAt?: string;
  failedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Favorite Location
interface FavoriteLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
}
```

---

## 🔒 Error Responses

Todos los endpoints pueden retornar estos errores:

### 400 Bad Request
```typescript
{
  statusCode: 400;
  message: string | string[];
  error: 'Bad Request';
}
```

### 401 Unauthorized
```typescript
{
  statusCode: 401;
  message: 'Unauthorized';
}
```

### 403 Forbidden
```typescript
{
  statusCode: 403;
  message: 'Forbidden resource';
  error: 'Forbidden';
}
```

### 404 Not Found
```typescript
{
  statusCode: 404;
  message: string;
  error: 'Not Found';
}
```

### 500 Internal Server Error
```typescript
{
  statusCode: 500;
  message: 'Internal server error';
}
```

---

## 📊 Dashboard Data Flow

### Al cargar el dashboard:
```typescript
// 1. Obtener usuario autenticado
GET /auth/me

// 2. Obtener perfil de pasajero
GET /passengers/profile

// 3. Obtener balance de wallet
GET /wallet/balance

// 4. Obtener notificaciones no leídas
GET /notifications/unread

// 5. Obtener últimas transacciones
GET /wallet/transactions?limit=10
```

### Para mostrar historial completo:
```typescript
// Transacciones paginadas
GET /passengers/payment-history?limit=20&offset=0
```

### Para recargar wallet:
```typescript
// 1. Crear recarga
POST /payment/recharge
{
  amount: 50000,
  paymentMethodType: 'CARD'
}

// 2. Redirigir a paymentLink
// 3. Wompi procesa el pago
// 4. Webhook actualiza la transacción
// 5. Frontend consulta estado
GET /payment/transaction/:id
```

---

## ✅ Checklist de Integración

- [ ] Implementar autenticación con JWT
- [ ] Guardar tokens en secure storage
- [ ] Implementar refresh token automático
- [ ] Mostrar perfil de usuario
- [ ] Mostrar balance de wallet
- [ ] Listar transacciones
- [ ] Implementar recarga con Wompi
- [ ] Implementar transferencias
- [ ] Mostrar notificaciones
- [ ] Implementar código de emergencia
- [ ] Manejar errores de red
- [ ] Implementar loading states
- [ ] Implementar pull-to-refresh

---

**Base URL**: `http://localhost:3001`  
**Versión**: 1.0.0  
**Última actualización**: 2025-12-19

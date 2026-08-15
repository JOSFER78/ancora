import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db, auth, storage, firebaseConfig, app } from './firebaseClient.js';
import { 
  onAuthStateChanged, 
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

/**
 * Universal Thenable Firestore Query Builder
 * Proporciona una interfaz fluida e intuitiva sobre Google Cloud Firestore.
 */
export class FirestoreQueryBuilder {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.conditions = [];
    this.orderByField = null;
    this.orderDirection = 'asc';
    this.limitCount = null;
    this.operation = 'select'; // 'select' | 'insert' | 'upsert' | 'update' | 'delete'
    this.payload = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
  }

  select(fields = '*') {
    if (this.operation === 'select') {
      this.selectedFields = fields;
    }
    return this;
  }

  insert(rows) {
    this.operation = 'insert';
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  upsert(rows) {
    this.operation = 'upsert';
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(data) {
    this.operation = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(field, value) {
    this.conditions.push({ field, op: '==', value });
    return this;
  }

  neq(field, value) {
    this.conditions.push({ field, op: '!=', value });
    return this;
  }

  in(field, values) {
    this.conditions.push({ field, op: 'in', value: values });
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.orderByField = field;
    this.orderDirection = ascending ? 'asc' : 'desc';
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async execute() {
    try {
      if (!db) {
        throw new Error('Firestore Database no está inicializado.');
      }

      // 1. INSERCIÓN
      if (this.operation === 'insert') {
        const added = [];
        for (const item of this.payload) {
          const docData = {
            ...item,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          if (item.id) {
            const docRef = doc(db, this.collectionName, String(item.id));
            await setDoc(docRef, docData, { merge: true });
            added.push({ id: String(item.id), ...docData });
          } else {
            const colRef = collection(db, this.collectionName);
            const docRef = await addDoc(colRef, docData);
            added.push({ id: docRef.id, ...docData });
          }
        }

        if (this.isSingle || this.isMaybeSingle) {
          return { data: added[0] || null, error: null };
        }
        return { data: added, error: null };
      }

      // 2. UPSERT
      if (this.operation === 'upsert') {
        const results = [];
        for (const item of this.payload) {
          const docId = item.id || doc(collection(db, this.collectionName)).id;
          const docRef = doc(db, this.collectionName, String(docId));
          const docData = {
            ...item,
            id: String(docId),
            updated_at: new Date().toISOString()
          };
          await setDoc(docRef, docData, { merge: true });
          results.push(docData);
        }
        if (this.isSingle || this.isMaybeSingle) {
          return { data: results[0] || null, error: null };
        }
        return { data: results, error: null };
      }

      // 3. ACTUALIZACIÓN (UPDATE)
      if (this.operation === 'update') {
        const idCondition = this.conditions.find(c => c.field === 'id');
        if (idCondition) {
          const docRef = doc(db, this.collectionName, String(idCondition.value));
          await setDoc(docRef, {
            ...this.payload,
            updated_at: new Date().toISOString()
          }, { merge: true });
          return { data: { id: idCondition.value, ...this.payload }, error: null };
        }

        const queryRef = this.buildFirestoreQuery();
        const snap = await getDocs(queryRef);
        const updatedDocs = [];
        for (const docSnap of snap.docs) {
          await updateDoc(docSnap.ref, {
            ...this.payload,
            updated_at: new Date().toISOString()
          });
          updatedDocs.push({ id: docSnap.id, ...docSnap.data(), ...this.payload });
        }
        return { data: updatedDocs, error: null };
      }

      // 4. ELIMINACIÓN (DELETE)
      if (this.operation === 'delete') {
        const idCondition = this.conditions.find(c => c.field === 'id');
        if (idCondition) {
          const docRef = doc(db, this.collectionName, String(idCondition.value));
          await deleteDoc(docRef);
          return { data: { id: idCondition.value }, error: null };
        }

        const queryRef = this.buildFirestoreQuery();
        const snap = await getDocs(queryRef);
        for (const docSnap of snap.docs) {
          await deleteDoc(docSnap.ref);
        }
        return { data: { count: snap.size }, error: null };
      }

      // 5. CONSULTA (SELECT)
      const idCondition = this.conditions.find(c => c.field === 'id' && c.op === '==');
      if (idCondition && this.conditions.length === 1) {
        const docRef = doc(db, this.collectionName, String(idCondition.value));
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          if (this.isMaybeSingle) return { data: null, error: null };
          if (this.isSingle) return { data: null, error: { message: 'Registro no encontrado', code: 'PGRST116' } };
          return { data: [], error: null };
        }
        const item = { id: docSnap.id, ...docSnap.data() };
        if (this.isSingle || this.isMaybeSingle) {
          return { data: item, error: null };
        }
        return { data: [item], error: null };
      }

      const queryRef = this.buildFirestoreQuery();
      const snap = await getDocs(queryRef);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (this.isSingle) {
        if (items.length === 0) return { data: null, error: { message: 'Registro no encontrado', code: 'PGRST116' } };
        return { data: items[0], error: null };
      }

      if (this.isMaybeSingle) {
        return { data: items[0] || null, error: null };
      }

      return { data: items, error: null };
    } catch (err) {
      console.warn(`[FirestoreQueryBuilder] Error en colección "${this.collectionName}":`, err.message);
      return { data: this.isSingle || this.isMaybeSingle ? null : [], error: err };
    }
  }

  buildFirestoreQuery() {
    let constraints = [];
    for (const cond of this.conditions) {
      constraints.push(where(cond.field, cond.op, cond.value));
    }
    if (this.orderByField) {
      constraints.push(orderBy(this.orderByField, this.orderDirection));
    }
    if (this.limitCount) {
      constraints.push(firestoreLimit(this.limitCount));
    }
    return query(collection(db, this.collectionName), ...constraints);
  }

  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch(onrejected) {
    return this.execute().catch(onrejected);
  }
}

/**
 * Cliente Universal de Base de Datos y Autenticación Áncora (Firebase 100% Real)
 */
export const dbClient = {
  from(collectionName) {
    return new FirestoreQueryBuilder(collectionName);
  },
  auth: {
    async getUser() {
      const user = auth?.currentUser;
      return { data: { user: user ? { id: user.uid, email: user.email, ...user } : null }, error: null };
    },
    async getSession() {
      const user = auth?.currentUser;
      return { 
        data: { 
          session: user ? { access_token: 'firebase-token', user: { id: user.uid, email: user.email } } : null 
        }, 
        error: null 
      };
    },
    async signInWithPassword({ email, password }) {
      try {
        if (!auth) throw new Error('Firebase Auth no está inicializado.');
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        return { data: { user: { id: user.uid, email: user.email, ...user } }, error: null };
      } catch (err) {
        console.error('Error en signInWithPassword:', err);
        return { data: { user: null }, error: err };
      }
    },
    async signUp({ email, password, options = {} }) {
      try {
        if (!auth) throw new Error('Firebase Auth no está inicializado.');
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        const role = options?.data?.role || 'paciente';
        const displayName = options?.data?.displayName || options?.data?.display_name || '';

        if (displayName) {
          try {
            await fbUpdateProfile(user, { displayName });
          } catch (pErr) {
            console.warn('No se pudo asignar displayName inicial:', pErr);
          }
        }

        try {
          await sendEmailVerification(user);
        } catch (verErr) {
          console.warn('Error al enviar correo de verificación:', verErr);
        }
        
        const userDoc = {
          id: user.uid,
          email: user.email,
          role: role,
          display_name: displayName || user.email?.split('@')[0] || '',
          email_verified: false,
          created_at: new Date().toISOString()
        };
        await dbClient.from('profiles').upsert([userDoc]);

        return { data: { user: { id: user.uid, email: user.email, emailVerified: user.emailVerified, ...user } }, error: null };
      } catch (err) {
        console.error('Error en signUp:', err);
        return { data: { user: null }, error: err };
      }
    },
    async resendVerificationEmail(userToVerify = null) {
      try {
        const targetUser = userToVerify || auth?.currentUser;
        if (!targetUser) throw new Error('No hay usuario activo para reenviar el correo.');
        await sendEmailVerification(targetUser);
        return { data: { success: true }, error: null };
      } catch (err) {
        console.error('Error en resendVerificationEmail:', err);
        return { data: null, error: err };
      }
    },
    async signInWithOAuth({ provider = 'google', options = {} } = {}) {
      try {
        if (!auth) throw new Error('Firebase Auth no está inicializado.');
        let user = null;

        if (Capacitor.isNativePlatform()) {
          try {
            const res = await FirebaseAuthentication.signInWithGoogle();
            const idToken = res.credential?.idToken;
            if (idToken) {
              const credential = GoogleAuthProvider.credential(idToken);
              const userCred = await signInWithCredential(auth, credential);
              user = userCred.user;
            } else if (res.user) {
              user = res.user;
            }
          } catch (nativeErr) {
            console.warn('[Native Google Auth] Fallback o cancelado:', nativeErr?.message);
          }
        }

        if (!user) {
          const googleProvider = new GoogleAuthProvider();
          googleProvider.addScope('email');
          googleProvider.addScope('profile');
          googleProvider.setCustomParameters({
            prompt: 'select_account'
          });

          try {
            const result = await signInWithPopup(auth, googleProvider);
            user = result.user;
          } catch (popupErr) {
            console.warn('[Firebase Auth] Popup bloqueado o cerrado:', popupErr?.code || popupErr?.message);
            if (
              popupErr?.code === 'auth/popup-blocked' || 
              popupErr?.code === 'auth/cancelled-popup-request' ||
              popupErr?.code === 'auth/popup-closed-by-user' ||
              popupErr?.message?.includes('popup')
            ) {
              console.log('[Firebase Auth] Activando signInWithRedirect como fallback seguro...');
              await signInWithRedirect(auth, googleProvider);
              return { data: { user: null, redirecting: true }, error: null };
            }
            throw popupErr;
          }
        }

        const pendingRole = (typeof localStorage !== 'undefined' && localStorage.getItem('pending_oauth_role')) || null;
        if (typeof localStorage !== 'undefined') localStorage.removeItem('pending_oauth_role');
        
        const profileDocRef = doc(db, 'profiles', String(user.uid));
        const existingSnap = await getDoc(profileDocRef);
        let userRole = 'paciente';
        
        const emailLower = (user.email || '').toLowerCase();
        if (emailLower === 'josferestudio@gmail.com') {
          userRole = 'supervisor';
        } else if (emailLower === 'usajosefernan@gmail.com' || emailLower === 'davidsevilla101@gmail.com') {
          userRole = 'psicologo';
        } else if (existingSnap.exists() && existingSnap.data()?.role) {
          userRole = existingSnap.data().role;
        } else if (pendingRole) {
          userRole = pendingRole;
        }

        const userDoc = {
          id: user.uid,
          email: user.email,
          role: userRole,
          display_name: user.displayName || user.email?.split('@')[0] || '',
          avatar_url: user.photoURL || '',
          updated_at: new Date().toISOString()
        };
        await setDoc(profileDocRef, userDoc, { merge: true });

        return { data: { user: { id: user.uid, email: user.email, role: userRole, ...user } }, error: null };
      } catch (err) {
        console.error('Error en signInWithOAuth:', err);
        return { data: { user: null }, error: err };
      }
    },
    async resetPasswordForEmail(email) {
      try {
        if (!auth) throw new Error('Firebase Auth no está inicializado.');
        await sendPasswordResetEmail(auth, email.trim());
        return { data: {}, error: null };
      } catch (err) {
        console.error('Error en resetPasswordForEmail:', err);
        return { data: null, error: err };
      }
    },
    async updateUser(attributes = {}) {
      try {
        const user = auth?.currentUser;
        if (!user) throw new Error('No hay usuario autenticado.');
        if (attributes.data?.displayName || attributes.displayName) {
          await fbUpdateProfile(user, { displayName: attributes.data?.displayName || attributes.displayName });
        }
        return { data: { user: { id: user.uid, email: user.email, ...user } }, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
    async signOut() {
      if (auth) await fbSignOut(auth);
      return { error: null };
    },
    onAuthStateChange(callback) {
      if (!auth) return { data: { subscription: { unsubscribe: () => {} } } };
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        const session = user ? { access_token: 'firebase-token', user: { id: user.uid, email: user.email } } : null;
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      });
      return { data: { subscription: { unsubscribe } } };
    }
  }
};

// Aliases para máxima compatibilidad y transición limpia
export const firebaseClient = dbClient;
export const ancoraClient = dbClient;
export const supabase = dbClient;
export default dbClient;

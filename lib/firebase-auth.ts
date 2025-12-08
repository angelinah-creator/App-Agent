// frontend/lib/firebase-auth.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  type Auth,
  type UserCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp
let auth: Auth

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
}

export const firebaseAuth = {
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result: UserCredential = await signInWithPopup(auth, provider)
    const idToken = await result.user.getIdToken()

    return {
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      },
      idToken,
    }
  },

  async signOut() {
    await firebaseSignOut(auth)
  },

  onAuthStateChanged(callback: (user: any) => void) {
    return firebaseOnAuthStateChanged(auth, callback)
  },
}

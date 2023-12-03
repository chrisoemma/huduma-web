import { MESUREMENT_ID, YOUR_API_KEY, YOUR_APP_ID, YOUR_AUTH_DOMAIN,
     YOUR_MESSAGING_SENDER_ID, YOUR_PROJECT_ID, YOUR_STORAGE_BUCKET } from '@/utils/config';
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: YOUR_API_KEY,
  authDomain: YOUR_AUTH_DOMAIN,
  projectId: YOUR_PROJECT_ID,
  storageBucket: YOUR_STORAGE_BUCKET,
  messagingSenderId: YOUR_MESSAGING_SENDER_ID,
  appId: YOUR_APP_ID,
  measurementId: MESUREMENT_ID
};



const app = initializeApp(firebaseConfig);

const storage = getStorage(app);

export { storage };

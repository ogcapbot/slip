// auth.js
import { auth, initRecaptcha } from '../firebaseInit.js';
import { signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { loadSports } from './sportSelector.js';

console.log('Auth in auth.js:', auth);

const loginSection = document.getElementById('phoneLoginSection');
const pickForm = document.getElementById('pickForm');

let phoneInput, sendCodeBtn, codeInput, verifyCodeBtn, loginError;

function createPhoneLoginUI() {
  loginSection.innerHTML = `
    <label for="phoneInput">Enter Phone Number</label>
    <input type="tel" id="phoneInput" placeholder="+1234567890" autocomplete="tel" />
    <button id="sendCodeBtn">Send Verification Code</button>
    <div id="recaptcha-container"></div>
    <div id="verificationCodeSection" style="display:none; margin-top:15px;">
      <label for="codeInput">Enter Verification Code</label>
      <input type="text" id="codeInput" placeholder="123456" maxlength="6" />
      <button id="verifyCodeBtn">Verify Code</button>
    </div>
    <p id="loginError" class="error"></p>
  `;

  phoneInput = document.getElementById('phoneInput');
  sendCodeBtn = document.getElementById('sendCodeBtn');
  codeInput = document.getElementById('codeInput');
  verifyCodeBtn = document.getElementById('verifyCodeBtn');
  loginError = document.getElementById('loginError');

  initRecaptcha();

  sendCodeBtn.addEventListener('click', sendVerificationCode);
  verifyCodeBtn.addEventListener('click', verifyCode);
}

let confirmationResult = null;

function sendVerificationCode() {
  loginError.textContent = '';
  const phoneNumber = phoneInput.value.trim();
  if (!phoneNumber.match(/^\+\d{10,15}$/)) {
    loginError.textContent = 'Enter a valid phone number in E.164 format (e.g., +1234567890).';
    return;
  }
  sendCodeBtn.disabled = true;

  const appVerifier = window.recaptchaVerifier;
  if (!appVerifier) {
    loginError.textContent = 'reCAPTCHA is not ready. Please refresh the page.';
    sendCodeBtn.disabled = false;
    return;
  }

  signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    .then((result) => {
      confirmationResult = result;
      loginError.textContent = 'Verification code sent. Check your phone.';
      document.getElementById('verificationCodeSection').style.display = 'block';
      sendCodeBtn.disabled = false;
    })
    .catch((error) => {
      console.error('Error during signInWithPhoneNumber:', error);
      loginError.textContent = `Failed to send verification code. ${error.message}`;
      sendCodeBtn.disabled = false;
    });
}

function verifyCode() {
  loginError.textContent = '';
  const code = codeInput.value.trim();
  if (code.length !== 6) {
    loginError.textContent = 'Enter the 6-digit verification code.';
    return;
  }
  verifyCodeBtn.disabled = true;

  confirmationResult.confirm(code)
    .then((result) => {
      loginSection.style.display = 'none';
      pickForm.style.display = 'block';
      loadSports();

      window.currentUser = {
        uid: result.user.uid,
        phoneNumber: result.user.phoneNumber
      };

      verifyCodeBtn.disabled = false;
    })
    .catch((error) => {
      console.error('Error verifying code:', error);
      loginError.textContent = `Invalid verification code. ${error.message}`;
      verifyCodeBtn.disabled = false;
    });
}

// Initialize UI on script load
createPhoneLoginUI();

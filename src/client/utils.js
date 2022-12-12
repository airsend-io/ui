import checkEmail from 'fastest-validator/lib/rules/email.js';

class Utils {
  // validate single mail
  validateEmail(content) {
    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return (
      checkEmail.call(this, content, {}) &&
      regex.test(String(content).toLowerCase())
    );
  }
}

export default new Utils();

window.airSendChatFormContent = `
<div id="airsend-embed-form">
    <div class="airsend-form-heading">
        <svg width="16" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.6021 5.28333C20.7621 5.15417 21 5.275 21 5.47917V14C21 15.1042 20.1182 16 19.0312 16H1.96875C0.881836 16 0 15.1042 0 14V5.48333C0 5.275 0.233789 5.15833 0.397852 5.2875C1.3166 6.0125 2.53477 6.93333 6.71836 10.0208C7.58379 10.6625 9.04395 12.0125 10.5 12.0042C11.9643 12.0167 13.4531 10.6375 14.2857 10.0208C18.4693 6.93333 19.6834 6.00833 20.6021 5.28333ZM10.5 10.6667C11.4516 10.6833 12.8215 9.45 13.5105 8.94167C18.9533 4.92917 19.3676 4.57917 20.6227 3.57917C20.8605 3.39167 21 3.1 21 2.79167V2C21 0.895833 20.1182 0 19.0312 0H1.96875C0.881836 0 0 0.895833 0 2V2.79167C0 3.1 0.139453 3.3875 0.377344 3.57917C1.63242 4.575 2.04668 4.92917 7.48945 8.94167C8.17852 9.45 9.54844 10.6833 10.5 10.6667Z" fill="white"></path>
        </svg>
        Contact Us
    </div>
    <form id="airsend-form">
        <div class="airsend-form-group">
            <div class="airsend-label">
                Name * <span class="airsend-warning form_filler_name_required">This field is required</span>
            </div>
            <div class="airsend-form-element">
                <input type="text" class="airsend-input" name="form_filler_name">
            </div>
        </div>
        <div class="airsend-form-group">
            <div class="airsend-label">
                Email *
                <span class="airsend-warning form_filler_email_required">This field is required</span>
                <span class="airsend-warning form_filler_email_email">Please enter a valid email</span>
            </div>
            <div class="airsend-form-element">
                <input type="text" class="airsend-input" name="form_filler_email">
            </div>
        </div>
        <div class="airsend-form-group">
            <div class="airsend-label">
                Message * <span class="airsend-warning form_filler_message_required">This field is required</span>
            </div>
            <div class="airsend-form-element">
                <textarea type="text" class="airsend-input" name="form_filler_message"></textarea>
            </div>
        </div>

        <div class="airsend-form-group airsend-button-parent">
            <button type="submit" id="airsend-submit-form" class="airsend-button">Send</button>
        </div>

    </form>

    <div class="airsend-after-submission">
    Thanks for your message. We will get back to you, shortly.
    </div>

    <div class="airsend-footer">
        Powered by <a href="http://airsend.io/" target="_blank" class="airsend-logo-text"> Airsend</a>
    </div>
    <style>
        :root {
            --airsend-grey:  #f2f2f2;
            --airsend-white: #fff;
            --airsend-primary: #0097C0;
            --airsend-primary-light: #458dda;
            --airsend-text-color: #4E5D78;
            --airsend-border-color: #E7E7E7;
        }
        #airsend-chat-window * {
            box-sizing: border-box;
        }
        .airsend-warning {
            display: none;
            color: red;
            position: absolute;
            right: 30px;
        }
        .warning-border {
            border-color: red;
        }
        #airsend-embed-form {
            max-height: 48px;
            width: 215px;
            transition: .2s ease-in;
        }
        #airsend-form {
            padding: 20px 25px 0;
        }
        .airsend-form-active > #airsend-embed-form{
            max-height:500px;
            width: 350px;
        }
        #airsend-embed-form{
            position: fixed;
            z-index: 9999;
            bottom: 14px;
            right: 17px;
            font-family: "Source Sans Pro", "Arial", sans-serif!important;
            border-radius: 4px;
            overflow: hidden;
            background-color: white;
            box-shadow: 0px 0px 5px 1px rgba(0,0,0,0.1);
        }
        .airsend-form-heading {
            font-weight: 700;
            background-color: var(--airsend-primary);
            padding: 15px 0px;
            padding-left: 30px;
            color: var(--airsend-white);
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            height: 48px;
        }
        .airsend-form-heading svg {
            margin-right: 10px;
        }
        .airsend-form-group {
            margin-bottom: 10px;
        }
        .airsend-label {
           font-size: 12px;
           color: var(--airsend-text-color);
        }
        .airsend-input {
            width: 100%;
            color: #333;
            padding: 10px 15px;
            font-size: 15px;
            border: 1px solid var(--airsend-border-color);
            color: var(--airsend-text-color);
            border-radius: 5px;
        }
        .airsend-input:hover,
        .airsend-input:focus {
            box-shadow: 0 0 10px rgba(0,0,0,0.15);
        }
        textarea.airsend-input {
            height: 110px;
        }
        .airsend-button-parent {
            text-align: center;
        }
        .airsend-button {
            background-color: var(--airsend-primary);
            color: var(--airsend-white);
            padding: 10px 40px!important;
            border: none;
            cursor: pointer;
        }
        .airsend-input,
        .airsend-button {
            font-size: 14px;
            padding: 10px 15px;
            border-radius: 5px;
        }
        .airsend-button:hover {
            background: var(--airsend-primary);
        }
        .airsend-footer {
            font-size: 10px!important;
            text-align: center;
            color: var(--airsend-text-color);
        }
        .airsend-footer .airsend-logo-text {
            color: #0097C0;
        }
        .airsend-footer a {
            color: var(--airsend-primary)
        }
        .airsend-after-submission {
            display: none;
            padding: 20px 30px;
            line-height: 1.3;
        }
        #airsend-embed-form.submitted .airsend-after-submission {
            display: block;
        }
        #airsend-embed-form.submitted form{
            display: none;
        }
    </style>
 </div>
 `;
 (function(){
    let airSendchat = document.createElement('div');
    airSendchat.id = "airsend-chat-window";
    airSendchat.innerHTML = window.airSendChatFormContent;
    document.querySelector('body').append(airSendchat);

    //setup
    let primColor = document.querySelector('[data-airsend-form-color]').dataset.airsendFormColor;
    document.documentElement.style.setProperty('--airsend-primary', primColor);

    // Form toggle
    let header = document.querySelector('.airsend-form-heading');
    header.addEventListener("click",()=>{
        airSendchat.classList.toggle('airsend-form-active')
    });

    // blur for input
    document.querySelectorAll('.airsend-input')
        .forEach( elem => elem.addEventListener('keyup',function(){
            let name = this.getAttribute('name');
            document.querySelector(`.${name}_required`).style.display = 'none';
            try {
                document.querySelector(`.${name}_email`).style.display = 'none';
            } catch(e) {}
            this.style['border-color'] = '';
        }));

    // Submit
    let form = document.querySelector('form#airsend-form');
    form.addEventListener('submit',(e)=>{
        e.preventDefault();
        let formData = new FormData(form);
        if(!validate(formData)) return;

        formData.append("form_id", Number(document.querySelector('[data-airsend-form-id]').dataset.airsendFormId));
        formData.append("form_hash", document.querySelector('[data-airsend-form-hash]').dataset.airsendFormHash);

        postForm(formData);
    })

    function postForm(formData){
        let submitBtn = document.querySelector('#airsend-submit-form');
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Sending your message ..";
        fetch("https://dev1.airsend.io/api/v1/contact_form.fill", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(res => {
            if(res.meta.ok){
                // Success
                let message = res.message;
                document.querySelector('.airsend-after-submission').innerText = message;
                document.querySelector('#airsend-embed-form').classList.toggle('submitted');
            }
            else {
                document.querySelector('.airsend-after-submission').innerText = 'Sorry, your message was not sent. Please try again later';
                document.querySelector('#airsend-embed-form').classList.toggle('submitted');
            }
        });
    }

    function validate(formData){
        resetWarning();
        let form_filler_name = formData.get('form_filler_name').trim(),
            form_filler_email = formData.get('form_filler_email').trim(),
            form_filler_message = formData.get('form_filler_message').trim();
        let validation = true;

        if(form_filler_name == '') {
            highLightWarning('form_filler_name');
        }
        if(form_filler_email == '') {
            highLightWarning('form_filler_email');
        }
        else if(!validateEmail(form_filler_email)) {
            highLightWarning('form_filler_email', true);
        }
        if(form_filler_message == '') {
            highLightWarning('form_filler_message');
        }
        function resetWarning(){
            document.querySelectorAll('.airsend-warning').forEach(elem=>{
                elem.style.display = 'none';
                elem.style['border-color'] = '';
            })
        }

        function highLightWarning(elem, isEmail){
            document.querySelector(`.${elem}${isEmail ? '_email' : '_required'}`).style.display = 'inline';
            document.querySelector(`[name =${elem}]`).style['border-color'] = 'red';
            validation = false;
        }

        function validateEmail(email) {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }

        return validation;
    }
 }());

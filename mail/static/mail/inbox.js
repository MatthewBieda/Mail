document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#emails-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // load e-mails
  fetch(`/emails/${mailbox}`)
  .then(respose => respose.json())
  .then(emails => {
    emails.forEach(email => show_email_list(email, mailbox));
  })

}

function show_email_list(email,mailbox) {
  const emailDiv = document.createElement('div');

  const recipient = document.createElement('div');
  if (mailbox === "inbox") {
    recipient.innerHTML = email.sender;
  } 
  else{
    recipient.innerHTML = email.recipients[0];  
  } 
  emailDiv.append(recipient);

  const subject = document.createElement('div');
  subject.innerHTML = email.subject;
  emailDiv.append(subject);

  const timestamp = document.createElement('div');
  timestamp.innerHTML = email.timestamp;
  emailDiv.append(timestamp);

  if(mailbox !== "sent") {
    const button = document.createElement('img');
    button.src = "static/mail/archive_resized.png"
    emailDiv.append(button);
    button.addEventListener('click', () => archive_or_unarchive(email.id, email.archived))
  }

  const emailCard = document.createElement('div');
  if(email.read){
    emailCard.className = "read card";
  }
  else{
    emailCard.className = "card";
  }
  emailCard.append(emailDiv);

  recipient.addEventListener('click', () => show_email_details(email.id));
  document.querySelector('#emails-view').append(emailCard);
}

function send_email(){
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });

  // delaying loading sent mailbox so it has time to update
  setTimeout(function(){ load_mailbox('sent'); }, 100);
  return false;
}

function archive_or_unarchive(email_id, archivalState) {
  const newValue = !archivalState;
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: newValue
    }) 
  })
  load_mailbox('inbox');
  //force page reload to show email has moved
  location.reload();
}

function show_email_details(email_id){
  
  // Show the mail's detail view
  document.querySelector('#emails-detail').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  const email_details = document.createElement('div');
  const reply_button = document.createElement('button');
  reply_button.id = "reply_button";
  reply_button.innerHTML = "Reply to this email";

  const sender = document.createElement('div');
  const recipient = document.createElement('div');
  const subject = document.createElement('div');
  const timestamp = document.createElement('div');
  const body = document.createElement('div');

  // fetch particular email
  fetch(`/emails/${email_id}`)
  .then(respose => respose.json())
  .then(email => {
    // process e-mails
    mark_email_as_read(email_id);

    sender.innerHTML = 'From: ' + email.sender;
    recipient.innerHTML = 'To: ' + email.recipients[0];
    subject.innerHTML = 'Subject: ' + email.subject;
    body.innerHTML = 'Body: ' + email.body;
    timestamp.innerHTML = 'Timestamp: ' + email.timestamp;

    email_details.append(sender);
    email_details.append(recipient);
    email_details.append(subject);
    email_details.append(body);
    email_details.append(timestamp);
    email_details.append(reply_button);

    document.querySelector('#emails-detail').innerHTML = '';
    document.querySelector('#emails-detail').append(email_details);

    document.querySelector('#reply_button').addEventListener('click', () => reply(email))

})
}

function mark_email_as_read(email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function reply(email){
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Pre-fill fields
  document.querySelector('#compose-recipients').value = email.sender;
  if (email.subject.includes("Re:")){
    document.querySelector('#compose-subject').value = email.subject;
  }
  else{
    document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
  }
  document.querySelector('#compose-body').value = 'On ' + email.timestamp + ' ' + email.sender + ' wrote: ' + email.body;
}
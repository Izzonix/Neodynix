document.getElementById('website-request-form').addEventListener('submit', async function(event) {
       event.preventDefault();

       const formData = new FormData(this);
       const data = {
         name: formData.get('name'),
         email: formData.get('email'),
         category: formData.get('category'),
         template: formData.get('template'),
         details: formData.get('details'),
         followup_link: `https://izzonix.github.io/Neodynix/additional-details.html` // Base URL for follow-up
       };

       try {
         const response = await fetch('https://a68abc6c-3dfa-437e-b7ed-948853cc9716-00-2psgdbnpe98f6.worf.replit.dev/submit-request', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify(data)
         });

         const result = await response.json();
         if (response.ok) {
           alert('Request submitted successfully! Check your email for further instructions.');
           this.reset();
         } else {
           alert('Error submitting request: ' + result.error);
         }
       } catch (error) {
         console.error('Error:', error);
         alert('An error occurred while submitting the request.');
       }
     });

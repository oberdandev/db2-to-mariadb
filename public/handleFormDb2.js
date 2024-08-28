document.getElementById('db2-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Evita o comportamento padrão do formulário

  const formData = new FormData(this);
  const formBody = new URLSearchParams(formData).toString(); // Converte FormData para application/x-www-form-urlencoded
  
  fetch(this.action, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody
  })
  .then(response => response.text())
  .then(data => {
      const alertContainer = document.getElementById('alert-containter-db2');
      alertContainer.innerHTML = ''; // Limpa alertas anteriores

      // Cria o alerta Bootstrap
      const alert = document.createElement('div');
      alert.className = 'alert alert-success'; // Define a classe do alerta
      alert.role = 'alert';
      alert.innerText = data;

      // Adiciona o alerta ao contêiner
      alertContainer.appendChild(alert);
  })
  .catch(error => {
      console.error('Erro ao enviar formulário:', error);
      
      const alertContainer = document.getElementById('alert-containter-db2');
      alertContainer.innerHTML = ''; // Limpa alertas anteriores

      // Cria o alerta Bootstrap
      const alert = document.createElement('div');
      alert.className = 'alert alert-danger'; // Define a classe do alerta
      alert.role = 'alert';
      alert.innerText = 'Erro ao tentar conectar com DB2.';

      // Adiciona o alerta ao contêiner
      alertContainer.appendChild(alert);
  });
});
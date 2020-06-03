# NodejsServer

## Richieste utenti

### Registrazione
* Indirizzo: localhost:1337/register
* Tipo di richiesta: POST
* Parametri:
  1. username -> il nome con cui l'utente si registra
  1. facebookid (opzionale) -> ID facebook dell'utente
* Restituisce: id -> header con l'id assegnato all'utente
* Errori:
  1. 422 in caso di parametri mancanti
  1. 501 in caso di errore del server

### Associazione Facebook
* Indirizzo: localhost:1337/associatefacebook
* Tipo di richiesta: POST
* Parametri:
  1. userid -> id utente restituito dalla registrazione
  1. facebookid -> ID facebook dell'utente
* Errori:
  1. 422 in caso di parametri mancanti
  1. 501 in caso di errore del server

### Inizio sessione
* Indirizzo: localhost:1337/startsession
* Tipo di richiesta: POST
* Parametri:
  1. userid -> id utente restituito dalla registrazione
  1. locationid -> ID della postazione in cui si sta iniziando la sessione
* Restituisce: sessionid -> header con l'id della sessione appena creata
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso la postazione abbia una sessione attiva o la sessione con l'utente e la postazione esiste già
  1. 501 in caso di errore del server

### Conferma sessione
* Indirizzo: localhost:1337/confirmsession
* Tipo di richiesta: POST
* Parametri:
  1. userid -> id utente restituito dalla registrazione
  1. locationid -> ID della postazione in cui si sta cofermando la sessione
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso la sessione non esista o sia stata già confermata
  1. 501 in caso di errore del server

### Richiesta nuova sessione in attesa
* Indirizzo: localhost:1337/getnewsession
* Tipo di richiesta: POST
* Parametri: locationid -> ID della postazione in cui si sta cofermando la sessione
* Restituisce:
  1. sessionid -> header con l'id della sessione trovata
  1. userid -> header con l'id dell'utente associato alla sessione
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso non ci siano sessioni in attesa per la postazione
  1. 501 in caso di errore del server

### Fine sessione
* Indirizzo: localhost:1337/endsession
* Tipo di richiesta: POST
* Parametri:
  1. userid -> id utente restituito dalla registrazione
  1. locationid -> ID della postazione in cui si sta cofermando la sessione
  1. gamestate -> stringa contenente le informazioni sulla sessione appena conclusa
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso la sessione non esista o non possa essere terminata
  1. 501 in caso di errore del server

## Richieste Admin

### Get User
* Indirizzo: localhost:1337/getuser
* Tipo di richiesta: GET
* Parametri: userid -> id utente
* Restituisce: dati dell'utente trovato (response body)
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso non esista un utente con l'ID richiesto
  1. 501 in caso di errore del server

### Lista utenti
* Indirizzo: localhost:1337/listusers
* Tipo di richiesta: GET
* Restituisce: lista di tutti gli utenti (response body)

### Aggiorna utente
* Indirizzo: localhost:1337/updateuser
* Tipo di richiesta: POST
* Parametri:
    1. userid -> id utente
    1. facebookid (opzionale) -> nuovo ID facebook da associare all'utente
    1. username (opzionale) -> nuovo username da assegnare all'utente
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso non esista un utente con l'ID richiesto
  1. 501 in caso di errore del server

### Aggiungi utente
* Indirizzo: localhost:1337/adduser
* Tipo di richiesta: POST
* Parametri:
    1. username -> nuovo username da assegnare all'utente
    1. facebookid (opzionale) -> nuovo ID facebook da associare all'utente
* Errori:
  1. 422 in caso di parametri mancanti
  1. 501 in caso di errore del server

### Rimuovi utente
* Indirizzo: localhost:1337/removeuser
* Tipo di richiesta: POST
* Parametri:
    1. userid -> id utente
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso non esista un utente con l'ID richiesto
  1. 501 in caso di errore del server


### Get Session
* Indirizzo: localhost:1337/getsession
* Tipo di richiesta: GET
* Parametri: sessionid -> id della sessione
* Restituisce: dati della sessione trovata (response body)
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso non esista una sessione con l'ID richiesto
  1. 501 in caso di errore del server

### Lista sessioni
* Indirizzo: localhost:1337/listsessions
* Tipo di richiesta: GET
* Restituisce: lista di tutti le sessioni (response body)

### Aggiorna sessione
* Indirizzo: localhost:1337/updatesession
* Tipo di richiesta: POST
* Parametri:
    1. sessionid -> id della sessione
    1. userid (opzionale) -> ID dell'utente a cui associare la sessione
    1. locationid (opzionale) -> ID della postazione in cui si svolge la sessione
    1. state (opzionale) -> stato in cui si trova la sessione
    1. gamestate (opzionale) -> informazioni sulla sessione
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso non esista una sessione con l'ID richiesto
  1. 501 in caso di errore del server

### Aggiungi sessione
* Indirizzo: localhost:1337/addsession
* Tipo di richiesta: POST
* Parametri:
    1. userid -> ID dell'utente a cui associare la sessione
    1. locationid -> ID della postazione in cui si svolge la sessione
    1. state -> stato in cui si trova la sessione
    1. gamestate (opzionale) -> informazioni sulla sessione
* Restituisce: sessionid -> header con l'id della sessione appena creata
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso esista già una sessione con l'utente e la postazione richiesti
  1. 501 in caso di errore del server

### Rimuovi sessione
* Indirizzo: localhost:1337/getsession
* Tipo di richiesta: POST
* Parametri: sessionid -> id della sessione
* Errori:
  1. 422 in caso di parametri mancanti
  1. 422 in caso non esista una sessione con l'ID richiesto
  1. 501 in caso di errore del server

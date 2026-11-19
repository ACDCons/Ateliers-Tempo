# Le besoin d’Ella

Ella donne des cours de piano, de guitare et de chant. Son site présente l’école et propose un formulaire de **demande de cours d’essai**. Elle suit ensuite chaque demande dans un petit CRM.

## Ce qui doit marcher

- Un visiteur envoie une demande avec son nom, son e-mail, et s’il le souhaite un téléphone et un message.
- Une demande incomplète ou une adresse e-mail invalide est refusée, avec un message clair.
- La même personne (même e-mail, majuscules ou pas) peut faire plusieurs demandes : un seul contact, plusieurs demandes.
- Dans le CRM, Ella retrouve chaque demande avec le contact et le message envoyés.
- Elle change le statut (Nouveau, En discussion, Inscrit, Perdu), ajoute une note, et ajoute une demande reçue par téléphone.
- Elle supprime une demande après confirmation. Le contact et ses autres demandes restent.

## Qui a le droit de quoi

| Qui | Ouvre le CRM | Voit les demandes | Ajoute, modifie, supprime |
| --- | --- | --- | --- |
| Visiteur non connecté | Non : renvoyé vers /connexion | Non | Non |
| Ella (gestionnaire) | Oui | Oui | Oui |
| Yanis (accès limité) | Oui | Non | Non |

## Ce qu’Ella n’a pas encore

Des tests. Elle voudrait être sûre que chaque nouvelle fonctionnalité ne casse pas ce qui marche déjà.

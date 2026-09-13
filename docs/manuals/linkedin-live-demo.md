# Première publication LinkedIn depuis le Mac

Cette procédure active de vrais appels LinkedIn pour un profil personnel ou
une Page autorisée. Les tests automatisés utilisent des réponses simulées ;
ils ne remplacent pas une connexion OAuth et une publication vérifiées sur
LinkedIn. Aucun accès développeur réel n’a été fourni lors de la préparation.

## 1. Obtenir les accès

Dans [LinkedIn Developers](https://www.linkedin.com/developers/apps), créer
l’application WePost, compléter les informations demandées et sa relation
avec une Page lorsque le formulaire l’exige. Cette association ne signifie
pas que les posts doivent être publiés sur cette Page.

Pour publier sur son profil, activer les produits **Share on LinkedIn** et
**Sign In with LinkedIn using OpenID Connect**. Vérifier les permissions
`openid`, `profile` et `w_member_social`. WePost ne demande pas l’adresse
e-mail LinkedIn, ni le mot de passe du compte.

Dans **Auth**, enregistrer exactement cette URL de redirection :

```text
http://127.0.0.1:3333/api/v1/social/linkedin/oauth/callback
```

La Page entreprise conserve le parcours existant : identifiant numérique de
Page, rôle autorisé et permissions `r_organization_admin` et
`w_organization_social`. L’accès aux produits d’organisation est distinct ;
la création d’une Page seule ne le garantit pas. Ne pas attendre cet accès
pour préparer le parcours personnel.

Sources officielles : [Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin),
[identité OpenID Connect](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2),
[Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-06).

## 2. Renseigner les paramètres localement

Créer `.demo/linkedin.env` en reprenant
`infra/demo/linkedin.env.example`. Renseigner seulement `LINKEDIN_APP_ID`,
`LINKEDIN_APP_SECRET` et `LINKEDIN_API_VERSION`. La version `202606` est celle
du contrat de l’adaptateur ; vérifier qu’elle est encore prise en charge dans
la documentation LinkedIn lors de la connexion.

Le dossier `.demo` est ignoré par Git. Ne jamais partager son contenu ou les
clés dans une capture, un document ou un message. Conserver les clés de
`.demo/runtime.env` : les jetons enregistrés en base en dépendent.

Depuis la racine du dépôt, avec Node.js 24 :

```bash
pnpm demo:linkedin:check
pnpm demo:oral:build
# Arrêter le lanceur de répétition précédent avec Ctrl+C.
pnpm demo:linkedin:start
```

Le contrôle vérifie la présence et le format des paramètres, pas leur validité
auprès de LinkedIn. Le démarrage réel doit être explicite. La commande
`demo:oral:start` conserve le mode simulé habituel. X, les autres réseaux et
les services d’e-mail ne sont pas activés par cette procédure.

## 3. Faire la démonstration

1. Ouvrir `http://127.0.0.1:3000`, se connecter comme agence et aller dans
   **LinkedIn**.
2. Choisir **Mon profil personnel**, puis **Continuer avec LinkedIn**.
   Autoriser WePost sur le site de LinkedIn. L’identité de publication est
   obtenue depuis l’API `userinfo`, pas saisie manuellement.
3. Au retour, vérifier le nom du profil et la mention **Connexion réelle à
   LinkedIn**. Les anciennes connexions simulées doivent être renouvelées ;
   le worker refuse leur utilisation en mode réel.
4. Créer une nouvelle publication ciblant LinkedIn. Pour le premier essai,
   utiliser un court texte explicitement identifié comme démonstration.
   Une image JPEG/PNG peut être ajoutée avant l’approbation.
5. Soumettre au client, se connecter comme client et approuver la version.
6. Revenir comme agence, choisir le profil dans **Publication LinkedIn**,
   valider puis programmer. Laisser la date vide uniquement si aucune date
   souhaitée n’est déjà définie sur le post. Confirmer l’envoi public.
7. Cliquer **Actualiser le statut LinkedIn**. Après une tentative réussie,
   ouvrir **Voir la publication sur LinkedIn** et vérifier le texte, l’auteur
   et le média sur le réseau lui-même.

L’application et ses données restent locales. Le worker transfère les octets
de l’image à LinkedIn depuis `.demo/media` ; R2 et une URL publique d’image ne
sont pas nécessaires pour cet envoi. L’accès Internet reste indispensable.
Les e-mails restent lisibles dans `.demo/outbox`, sans envoi externe.

## En cas de problème

- Permission refusée : vérifier les produits accordés, puis reconnecter le
  compte. Ne pas ajouter les scopes d’organisation au parcours personnel.
- Jeton expiré sans possibilité de renouvellement : refaire la connexion OAuth.
- Mauvais mode de compte : reconnecter le compte après avoir choisi le
  lanceur réel ou simulé. Les deux modes ne doivent pas être confondus.
- Envoi en échec : relever l’erreur normalisée et vérifier le profil LinkedIn
  avant toute relance. Une réponse perdue après acceptation par le réseau
  peut laisser l’issue d’un appel incertaine ; le simple identifiant local
  d’idempotence n’est pas une garantie universelle contre ce cas.

Avant l’oral, répéter au moins un envoi réel complet sur le compte retenu et
conserver son lien. Une CI verte seule ne constitue pas cette preuve.

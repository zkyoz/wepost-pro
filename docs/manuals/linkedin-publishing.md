# Publication LinkedIn

## Configuration

Créer une application LinkedIn, demander le produit/accès Community Management requis et déclarer exactement le callback de chaque environnement. L’utilisateur OAuth doit administrer l’organisation cible et disposer d’un rôle permettant la publication.

```text
SOCIAL_TOKEN_ENCRYPTION_KEY=<32 octets en base64>
LINKEDIN_API_DRIVER=linkedin
LINKEDIN_APP_ID=<secret Coolify>
LINKEDIN_APP_SECRET=<secret Coolify>
LINKEDIN_API_VERSION=<version active YYYYMM validée dans le portail>
LINKEDIN_OAUTH_REDIRECT_URI=https://api.wepost.pro/api/v1/social/linkedin/oauth/callback
LINKEDIN_OAUTH_SUCCESS_URL=https://app.wepost.pro/settings/linkedin
```

Fournir au worker la même clé de chiffrement, `LINKEDIN_API_DRIVER`, `LINKEDIN_API_VERSION` et les accès R2 privés. Nuxt ne reçoit aucun secret. Les scopes demandés sont `r_organization_admin` et `w_organization_social`. La disponibilité de ces scopes, l’accès au produit et la version API active doivent être vérifiés dans l’application réelle ; remplacer `TODO_SET_FROM_LINKEDIN_DEVELOPER_PORTAL` avant d’activer le driver.

## Périmètre livré

- post texte d’organisation ;
- post avec une image JPEG ou PNG validée et stockée en privé dans R2 ;
- upload de l’image via l’API Images, puis création avec l’API Posts ;
- organisation cible explicite et contrôle de rôle ;
- idempotence interne par publication, réseau, version et compte ;
- renouvellement si un refresh token est fourni aux partenaires LinkedIn approuvés.

Vidéos, documents, carrousels, sondages, profils personnels, campagnes publicitaires et messagerie sont hors périmètre de cette version.

## Utilisation

1. ouvrir **LinkedIn** avec un compte admin/agence ;
2. saisir l’identifiant numérique de l’organisation et terminer OAuth ;
3. vérifier l’organisation, les scopes et l’expiration sans afficher le token ;
4. approuver une publication ciblant LinkedIn, avec zéro ou une image JPEG/PNG propre ;
5. lancer **Valider pour LinkedIn**, choisir la date puis programmer ;
6. consulter le statut et les tentatives ; corriger puis relancer un échec définitif ;
7. utiliser **Renouveler l’accès** lorsque cette capacité est disponible, sinon reconnecter ;
8. déconnecter localement puis révoquer aussi l’application depuis LinkedIn si nécessaire.

## Exploitation

Le worker tourne comme service Coolify séparé. Superviser `social.linkedin_*`, durée, retries et statuts PostgreSQL, puis configurer l’alerte d’échec > 5 % sur 24 h. Vérifier la version LinkedIn mensuelle avant sa date de fin de support.

Références officielles : [OAuth LinkedIn](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication), [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api), [droits des organisations](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/organization-access-control-by-role) et [refresh tokens](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens).

# static_website

Version open-source allegee de l'interface Samena. Le projet contient le frontend complet (gabarits HTML, CSS, JS) et un backend Flask minimal qui sert uniquement les pages et fournit des reponses factices pour garder la navigation fonctionnelle.

## Demarrage rapide

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
set STATIC_WEBSITE_PASSWORD=demo  # facultatif : changez le mot de passe de la demo
python main.py
```

Ensuite, ouvrez http://localhost:5000 dans votre navigateur et connectez-vous avec n'importe quel nom d'entreprise et le mot de passe defini (par defaut `demo`).

## Personnalisation

- `STATIC_WEBSITE_PASSWORD` permet de fixer un mot de passe simple pour la version deployee.
- `STATIC_WEBSITE_SECRET` vous laisse definir une cle secrete Flask personnalisee (sinon valeur par defaut `change-me` utilisee).
- Les assets se trouvent dans `static/` et les gabarits dans `templates/`.

Les fonctionnalites IA et d'automatisation ont ete retirees pour eviter toute fuite de cles/API ou donnees sensibles. Vous pouvez reconnecter vos propres services en creant vos endpoints dans `main.py`.

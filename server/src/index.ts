import express, { Express, Request, Response } from "express"
import session from "express-session"
import path from "path"
import passport from "passport"
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import history from "connect-history-api-fallback"
import * as passportStrategy from "passport-local"
import apiRouter from "./routes"
import publicApiRouter from "./routes/public"
import { createServer } from 'http'
import { User } from "../../models/src"
import db from "./db"
import connection from "./db/connection"
import userApi from "./api/user"

const AUTH_COOKIE_NAME: string = 'lp-session'

const MySQLStore = require('express-mysql-session')(session);
const options = {
    ...connection,
    createDatabaseTable: true
}
const sessionStore = new MySQLStore(options);

const app: Express = express()


// app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    name: AUTH_COOKIE_NAME,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30,
    },
    secret: process.env.SECRET || '',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new passportStrategy.Strategy(
    { usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
        try {
            if (!email) { done(null, false) }
            const user = await userApi.getByEmailAndPassword(email, password)
            done(null, user)
        } catch (e: any) {
            done(e, false, {
                message: e.message
            });
        }
    }));

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.BASE_URL + '/auth/google/callback',
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
            const googleId = profile.id;
            const email = profile.emails[0].value;
            const username = profile.displayName;
            const avatar = profile.photos?.[0]?.value;
            const token = accessToken;
            const creation_date = new Date();
            const last_login_date = new Date();

            const rows = await userApi.getUserInfo(email)

            if (rows.length > 0) {
                // Update last login and token
                await db.executeUpdate(`
                UPDATE users SET last_login_date = ?, token = ? WHERE googleId = ?
                `, [last_login_date, token, googleId]);

                return done(null, rows[0]);
            } else {
                // Insert new user
                const result = await db.executeInsert(`
                INSERT INTO users (username, email, creation_data, last_login_date, status, googleId, token, avatar)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    username,
                    email,
                    creation_date,
                    last_login_date,
                    'active',
                    googleId,
                    token,
                    avatar
                ]);

                profile.id = result

                return done(null, profile);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user)
});


passport.deserializeUser((user: User, done) => {
    done(null, user);
});

app.post("/api/login", express.json(), passport.authenticate('local'), async (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        res.json(req.user)
    } else {
        res.status(401).json("Credenziali non valide")
    }
})

app.post("/api/logout", async (req: Request, res: Response) => {
    res.clearCookie(AUTH_COOKIE_NAME)
    res.json(1)
})

app.get("/api/checkauthentication", express.json(), async (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        const user: any = req.user
        if (user.provider === 'google') {
            user.username = user.displayName
            user.email = user.emails[0].value
            user.avatar = user.photos[0].value
        }
        // console.log(req.user)
        res.json(user)
    }
    else {
        res.json(0)
    }
})

app.get('/api/search-track', async (req, res) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query param "q" (search term) is required' });
    }

    try {
        const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=10`);
        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
            console.log(data.data)
            const tracks = data.data.map((track:any) => { return {
                id: track.id,
                name: track.title,
                artist: track.artist.name,
                duration: track.duration,
                album: track.album.title,
                link: track.link
            }});
            return res.json(tracks);
        } else {
            return res.json([]);
        }
    } catch (error) {
        console.error('Error fetching from Deezer:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.use('public', express.json(), publicApiRouter)

app.get("/auth/google",
    passport.authenticate('google', { scope: ['profile', 'email'] })
)

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/auth/failure',
        session: true,
    }),
    (req, res) => {
        res.redirect('/mybands')
    }
)

app.use('/api', express.json(), (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated() || /\/public\//.test(req.path) || /\/auth/.test(req.path)) {
        next()
    }
    else {
        res.status(401).json('Unauthorized')
    }
}, apiRouter)

app.use(history());

app.use(express.static(path.join(__dirname, 'static')))

// start listening

const server = createServer(app)

const port = process.env.PORT || 3000
server.listen(port, () => {
    console.log(`App is listening on port ${port}`)
})

process.on('SIGTERM', () => {
    console.log('SIGTERM received')
    server.close(() => {
        db.closePool().then(() => {
            console.log('Database pool closed')
            process.exit(0)
        })
    })
})
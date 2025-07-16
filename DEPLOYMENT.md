# Deployment Guide

This guide will help you deploy the Movie TV Tracking API to external services where TMDB API calls will work properly.

## Why Deploy Externally?

Since your local network (Jio) blocks TMDB API calls, you need to deploy to an external service where the API calls can reach TMDB servers successfully.

## Recommended Deployment Options

### 1. Render.com (Recommended)

**Pros:**
- Free tier available
- Automatic deployments from GitHub
- Built-in SSL certificates
- Good performance
- Easy environment variable management

**Steps:**
1. **Create Render Account**: Go to [render.com](https://render.com) and sign up
2. **Connect GitHub**: Link your GitHub account
3. **Create Web Service**: 
   - Choose "Web Service"
   - Connect your repository
   - Use these settings:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Node Version**: 18 (or latest)
4. **Set Environment Variables**:
   - `TMDB_API_KEY`: Your TMDB API key
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `*` (or your frontend domain)
5. **Deploy**: Click "Create Web Service"

**Your API will be available at**: `https://your-app-name.onrender.com`

### 2. Railway.app

**Pros:**
- Very simple deployment
- Good free tier
- Fast deployments

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up and connect GitHub
3. Deploy from GitHub repository
4. Add environment variables in dashboard
5. Your app will be live automatically

### 3. Replit

**Pros:**
- Can code and deploy in browser
- Good for testing and development
- Free tier available

**Steps:**
1. Go to [replit.com](https://replit.com)
2. Import from GitHub or create new Node.js repl
3. Copy your code to the repl
4. Add environment variables in "Secrets" tab:
   - `TMDB_API_KEY`: Your TMDB API key
5. Run the application
6. Use the provided URL to access your API

### 4. Vercel (Serverless)

**Note**: Requires slight modifications for serverless deployment.

## Testing Your Deployment

Once deployed, test these endpoints:

1. **Health Check**:
   ```bash
   curl https://your-app.onrender.com/health
   ```

2. **Categories**:
   ```bash
   curl https://your-app.onrender.com/api
   ```

3. **Search** (this should work now that TMDB isn't blocked):
   ```bash
   curl "https://your-app.onrender.com/api/search/multi?query=batman"
   ```

4. **Movie Details**:
   ```bash
   curl https://your-app.onrender.com/api/movie/550
   ```

## Environment Variables Setup

Make sure to set these in your deployment platform:

| Variable | Value | Notes |
|----------|-------|-------|
| `TMDB_API_KEY` | Your actual API key | Get from TMDB website |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | Usually auto-set | Platform will set this |
| `CORS_ORIGIN` | `*` or your domain | Set to your frontend URL in production |

## Getting Your TMDB API Key

1. Go to [themoviedb.org](https://www.themoviedb.org/)
2. Create an account
3. Go to Settings → API
4. Request an API key
5. Choose "Developer" option
6. Fill out the form
7. Copy your API key

## Monitoring Your Deployment

### Check Logs
Most platforms provide logs to help debug issues:
- **Render**: Go to your service dashboard → Logs
- **Railway**: Click on your deployment → Logs
- **Replit**: Check the console output

### Common Issues

1. **API Key Not Set**:
   - Error: "TMDB API key is required"
   - Solution: Add `TMDB_API_KEY` environment variable

2. **Port Issues**:
   - Error: App not accessible
   - Solution: Ensure your app uses `process.env.PORT`

3. **CORS Issues**:
   - Error: CORS policy blocks requests
   - Solution: Set `CORS_ORIGIN` to your frontend domain

## Performance Tips

1. **Enable Caching**: Consider adding Redis for caching TMDB responses
2. **Monitor Usage**: Keep track of your TMDB API usage limits
3. **Rate Limiting**: The app has built-in rate limiting to prevent abuse
4. **Health Checks**: Use `/health` endpoint for monitoring

## Security in Production

The app includes several security features:
- Rate limiting
- Input validation
- Security headers
- CORS protection
- Request size limits

Make sure to:
- Set `NODE_ENV=production`
- Use specific CORS origins (not `*`) in production
- Monitor your logs for suspicious activity
- Keep dependencies updated

## Next Steps

After deployment:
1. Test all endpoints work correctly
2. Update your frontend to use the new API URL
3. Monitor performance and usage
4. Consider setting up a custom domain
5. Set up monitoring/alerting if needed

## Support

If you encounter issues:
1. Check the platform's documentation
2. Review the application logs
3. Test endpoints individually
4. Verify environment variables are set correctly
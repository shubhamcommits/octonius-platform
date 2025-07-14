# FAQ & Troubleshooting

## Common Issues

### 1. SafeValue/HTML Rendering Errors
- **Problem**: "SafeValue must use [property]=binding" or HTML tags show as text
- **Solution**: Use `[appRichHtml]` directive for rendering rich HTML content

### 2. Placeholder Not Visible in Editor
- **Problem**: Placeholder text not showing in Tiptap editor
- **Solution**: Ensure correct CSS and Placeholder extension config (see `/docs/frontend-guide.md`)

### 3. Docker Compose Fails
- **Problem**: Services not starting
- **Solution**: Check Docker version, ports, and `.env` files

### 4. Database Connection Issues
- **Problem**: Cannot connect to Postgres
- **Solution**: Check DB URL, credentials, and network access

## Where to Get Help
- Check the docs first
- Ask in your team Slack/Discord
- Open an issue on GitHub 
export function changeTheme(theme: string) {
    const htmls = document.getElementsByTagName('html');
    // assume first html in the collections is the one with theme attribute
    const html = htmls[0];
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}
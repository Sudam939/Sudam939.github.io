document.addEventListener('DOMContentLoaded', function () {
    // Open the drawer
    document.getElementById('menu-toggle').addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent the event from bubbling up to the document
        document.getElementById('drawer-menu').style.transform = 'translateX(0)';
    });

    // Close the drawer when clicking the close button
    document.getElementById('close-menu').addEventListener('click', function () {
        document.getElementById('drawer-menu').style.transform = 'translateX(-100%)';
    });

    // Close the drawer when clicking outside of it
    document.addEventListener('click', function (event) {
        var drawer = document.getElementById('drawer-menu');
        if (!drawer.contains(event.target) && event.target.id !== 'menu-toggle') {
            drawer.style.transform = 'translateX(-100%)';
        }
    });
});



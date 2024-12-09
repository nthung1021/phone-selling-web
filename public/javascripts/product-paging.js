document.querySelectorAll('.pagination-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        // Kiểm tra nếu URL có chứa dấu '#'
        if (window.location.hash) {
            return;  // Nếu có dấu '#', không thực hiện phân trang
        }

        const page = e.target.dataset.page;  // Lấy số trang từ thuộc tính data-page
        const query = new URLSearchParams(window.location.search).get('q') || '';  // Lấy từ khóa tìm kiếm (nếu có)

        // Tạo URL mới với số trang và query (nếu có)
        const newUrl = `/product?q=${query}&page=${page}`;

        // Điều hướng tới URL mới để tải trang với dữ liệu phân trang mới
        window.location.href = newUrl;
    });
});

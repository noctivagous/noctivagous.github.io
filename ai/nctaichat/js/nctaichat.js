document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        submitQuery();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
        generateTableOutput();
    }
});




function addResponseToAccordion(responseText) {
    const newItem = $('<h3>').text(`Chat Response ${$('#chatOutputAccordion > h3').length + 1}`);
    const content = $('<div>').text(responseText).append(
        $('<button>').text('Delete').click(function() {
            $(this).closest('h3, div').remove();
        })
    );
    $('#chatOutputAccordion').append(newItem, content);
    $('#chatOutputAccordion').accordion('refresh');
}

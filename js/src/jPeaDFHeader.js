var jPeaDFHeader = function(header_text, options) {
    this.debug = {creation: false};
    this.pdf_obj = null;
    //this.debug = false;
    this.parent = null;
    this.options = {};
    this.header_text = header_text;
    createStandardOptions(this, options);


    // the block options
    this.options.header_type = (options && options.type) || 'h1';
    this.options.halign = (options && options.halign) || 'c';
    this.options.valign = (options && options.valign) || 'm';
    // styles

    if (options && options.font_size) {
        this.options.font_size = options.font_size;
    } else {
        switch (this.options.header_type) {
            case 'h1':
                this.options.font_size = 18;
                break;
            case 'h2':
                this.options.font_size = 16;
                break;
            case 'h3':
                this.options.font_size = 14;
                break;
            case 'h4':
                this.options.font_size = 12;
                break;
            default:
                this.options.font_size = 18;
        }
    }

}

jPeaDFHeader.prototype.setParent = function(p) {
    this.parent = p;
}

jPeaDFHeader.prototype.setPdfObj = function(obj) {
    this.pdf_obj = obj;
}

jPeaDFHeader.prototype.calculateSize2 = function(parent) {

    var obj = this.pdf_obj;
    // ****** Updating the position based on the margin//
    obj.doc.setFontSize(this.options.font_size);// set the font size of this item
    applyChildSize(parent, this); // this applies the inital widths and heights
    
    obj.ypos += this.options.margin_top;
    if (obj.ypos > obj.options.height - obj.options.padding_bottom) {// check if after the margin it flows to the next page!
        obj.goToNextPage();// go to next page
        obj.ypos = obj.options.padding_top; // reset the current y position to zero
    }

    this.start_y_page = obj.doc.getPage();// add the margin; // the actual start page of the object
    this.start_y_pos = obj.ypos;

    // get the height
    var splits = obj.doc.splitTextToSize(this.header_text.toString(), this.options.width - this.options.padding_left - this.options.padding_right, {});
    var overflow = this.options ? (this.options.overflow) : this.options.overflow;
    this.header_text = overflow ? splits : [splits[0]];// if there is an overflow
    var temp_height = (this.options.line_spacing * this.header_text.length) + this.options.padding_top + this.options.padding_bottom;
    this.options.height = Math.max(temp_height, this.options.height);



    // check the height! if it exceeds to next page. Remember, tables/lists with overflowing texts shouldnt have FIXED height parents
    if (obj.ypos + this.options.height > obj.options.height - obj.options.padding_bottom) {// check if after the margin it flows to the next page!
        obj.goToNextPage();// go to next page
        obj.ypos = obj.options.padding_top + this.options.padding_top; // reset the current y position to zero + the correct paddings for document and paent block!
    }


    this.end_y_page = obj.doc.getPage();
    this.end_y_pos = obj.ypos + this.options.height;

}

jPeaDFHeader.prototype.draw2 = function() {

    var obj = this.pdf_obj;
    obj.doc.setFontSize(this.options.font_size);
    obj.setColor(this.options.font_color, [0, 0, 0]);
    obj.goToPage(this.start_y_page);
    obj.ypos = this.start_y_pos;

    // draw the background for the item
    obj.drawBackgrounds(this.options.fill_color, this.options.border_width, this.options.border_color, this.start_y_page, this.start_y_pos, this.end_y_page, this.end_y_pos, this.options.height, this.posXStart, this.options.width);
    // draw all the children items
    obj.drawSplitText(this.header_text, this.options.font_size, this.options.line_spacing, this.options.width, this.options.height, this.posXStart, 0, [this.options.padding_left, this.options.padding_right, this.options.padding_top, this.options.padding_bottom], this.options.halign, this.options.valign, false);
}
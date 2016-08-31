<?php
namespace AppBundle\Controller\Admin;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

/**
 * class: DefaultController
 * -----------------------------------------------------
 * Created by MihailShirnin on 31.08.2016.
 */

class DefaultController extends Controller
{

	public function indexAction()
	{

//	    /**
//	     * @var BannerRepository
//	     */
//    	$Testing = App::getRepository('AppBundle:Testing');
//	    App::dump($Testing->findAll());
//	    App::dump( App::getCurLocale());
		// replace this example code with whatever you need
		return $this->render('default/index.html.twig', [
			'base_dir' => realpath($this->getParameter('kernel.root_dir').'/..'),
		]);
	}
}

